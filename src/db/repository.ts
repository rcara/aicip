import { and, count, desc, eq, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";

import { accountRetentionDays } from "@/lib/config";
import { AppError, isUniqueViolation } from "@/lib/errors";
import { contentHash } from "@/modules/scenarios/hash";
import { parseScenario, type Scenario } from "@/modules/scenarios/schema";
import {
  SimulationError,
  advance,
  commitChoice,
  positionAfter,
  replayFrom,
  startAttempt,
  type AttemptEvent,
  type AttemptState,
} from "@/modules/simulation/engine";
import { computeFeedback } from "@/modules/learning/feedback";
import { canAccessAttempt, type Actor } from "@/modules/identity/actor";

import { getDb } from "./client";
import {
  account,
  aiUsage,
  analyticsEvents,
  attemptEvents,
  attempts,
  deletionJournal,
  scenarioVersions,
  scenarios,
  session,
  user,
} from "./schema";

const DEMO_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type AttemptRow = typeof attempts.$inferSelect;
type EventRow = typeof attemptEvents.$inferSelect;

export type PublishedScenario = {
  scenarioDbId: string;
  versionId: string;
  slug: string;
  scenario: Scenario;
  contentHash: string;
};

function toEvent(row: EventRow): AttemptEvent {
  const payload = row.payloadJson ?? {};
  const effects =
    payload.effects && typeof payload.effects === "object"
      ? (payload.effects as Record<string, number>)
      : null;
  return {
    sequence: row.sequence,
    type: row.eventType as AttemptEvent["type"],
    nodeId: row.nodeId,
    choiceId: row.choiceId,
    idempotencyKey: row.idempotencyKey,
    effects,
  };
}

function toState(row: AttemptRow, events: EventRow[], scenario: Scenario, hash: string): AttemptState {
  const mapped = events.map(toEvent);
  return {
    id: row.id,
    scenarioVersionId: row.scenarioVersionId,
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    contentHash: hash,
    status: row.status === "completed" ? "completed" : "in_progress",
    currentNodeId: positionAfter(scenario, mapped),
    events: mapped,
    parentAttemptId: row.parentAttemptId,
    branchedFromSequence: row.branchFromSequence,
  };
}

async function loadVersion(versionId: string): Promise<PublishedScenario> {
  const db = getDb();
  const rows = await db
    .select({
      version: scenarioVersions,
      slug: scenarios.slug,
      scenarioDbId: scenarios.id,
    })
    .from(scenarioVersions)
    .innerJoin(scenarios, eq(scenarios.id, scenarioVersions.scenarioId))
    .where(eq(scenarioVersions.id, versionId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    throw new AppError("NOT_FOUND", "Version de scénario introuvable.", 404);
  }
  return {
    scenarioDbId: row.scenarioDbId,
    versionId: row.version.id,
    slug: row.slug,
    scenario: parseScenario(row.version.contentJson),
    contentHash: row.version.contentHash,
  };
}

export async function getPublishedBySlug(slug: string): Promise<PublishedScenario | null> {
  const db = getDb();
  const rows = await db
    .select({
      version: scenarioVersions,
      slug: scenarios.slug,
      scenarioDbId: scenarios.id,
    })
    .from(scenarios)
    .innerJoin(scenarioVersions, eq(scenarioVersions.scenarioId, scenarios.id))
    .where(and(eq(scenarios.slug, slug), eq(scenarioVersions.status, "published")))
    .orderBy(desc(scenarioVersions.versionNumber))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    scenarioDbId: row.scenarioDbId,
    versionId: row.version.id,
    slug: row.slug,
    scenario: parseScenario(row.version.contentJson),
    contentHash: row.version.contentHash,
  };
}

export async function listPublishedScenarios(): Promise<
  Array<{
    slug: string;
    title: string;
    audience: string;
    difficulty: Scenario["difficulty"];
    durationMinutes: number;
    objective: string;
  }>
> {
  const db = getDb();
  const rows = await db
    .select({
      slug: scenarios.slug,
      content: scenarioVersions.contentJson,
      versionNumber: scenarioVersions.versionNumber,
    })
    .from(scenarios)
    .innerJoin(scenarioVersions, eq(scenarioVersions.scenarioId, scenarios.id))
    .where(and(eq(scenarios.status, "published"), eq(scenarioVersions.status, "published")))
    .orderBy(scenarios.title);
  const bySlug = new Map<string, { versionNumber: number; scenario: Scenario; slug: string }>();
  for (const row of rows) {
    const scenario = parseScenario(row.content);
    const current = bySlug.get(row.slug);
    if (!current || row.versionNumber > current.versionNumber) {
      bySlug.set(row.slug, { versionNumber: row.versionNumber, scenario, slug: row.slug });
    }
  }
  return [...bySlug.values()].map((item) => ({
    slug: item.slug,
    title: item.scenario.title,
    audience: item.scenario.audience,
    difficulty: item.scenario.difficulty,
    durationMinutes: item.scenario.durationMinutes,
    objective: item.scenario.objective,
  }));
}

async function readBundle(attemptId: string): Promise<{
  row: AttemptRow;
  state: AttemptState;
  published: PublishedScenario;
}> {
  const db = getDb();
  const found = await db.select().from(attempts).where(eq(attempts.id, attemptId)).limit(1);
  const row = found[0];
  if (!row) throw new AppError("NOT_FOUND", "Tentative introuvable.", 404);
  const published = await loadVersion(row.scenarioVersionId);
  const events = await db
    .select()
    .from(attemptEvents)
    .where(eq(attemptEvents.attemptId, attemptId))
    .orderBy(attemptEvents.sequence);
  return {
    row,
    state: toState(row, events, published.scenario, published.contentHash),
    published,
  };
}

function assertOwner(row: AttemptRow, actor: Actor): void {
  if (!canAccessAttempt(row, actor)) {
    throw new AppError("NOT_FOUND", "Tentative introuvable.", 404);
  }
}

async function persistNewEvents(
  attemptId: string,
  previousCount: number,
  next: AttemptState,
  idempotencyKey: string,
): Promise<{ state: AttemptState; idempotent: boolean; published: PublishedScenario }> {
  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select id from attempts where id = ${attemptId} for update`);
      const existing = await tx
        .select()
        .from(attemptEvents)
        .where(eq(attemptEvents.attemptId, attemptId))
        .orderBy(attemptEvents.sequence);
      const already = existing.find((event) => event.idempotencyKey === idempotencyKey);
      const version = await loadVersion(
        (await tx.select().from(attempts).where(eq(attempts.id, attemptId)).limit(1))[0]!
          .scenarioVersionId,
      );
      if (already) {
        const row = (await tx.select().from(attempts).where(eq(attempts.id, attemptId)).limit(1))[0]!;
        return { state: toState(row, existing, version.scenario, version.contentHash), idempotent: true, published: version };
      }
      if (existing.length !== previousCount) {
        throw new SimulationError("CONFLICT", "La tentative a changé. Rechargez la page.");
      }
      const fresh = next.events.slice(existing.length);
      for (const event of fresh) {
        await tx.insert(attemptEvents).values({
          attemptId,
          sequence: event.sequence,
          eventType: event.type,
          nodeId: event.nodeId,
          choiceId: event.choiceId,
          idempotencyKey: event.idempotencyKey,
          payloadJson: { effects: event.effects },
        });
      }
      const indicator =
        next.status === "completed"
          ? computeFeedback(version.scenario, next).exerciseIndicator
          : null;
      await tx
        .update(attempts)
        .set({
          status: next.status,
          finalScore: indicator,
          completedAt: next.status === "completed" ? new Date() : null,
        })
        .where(eq(attempts.id, attemptId));
      const row = (await tx.select().from(attempts).where(eq(attempts.id, attemptId)).limit(1))[0]!;
      const stored = await tx
        .select()
        .from(attemptEvents)
        .where(eq(attemptEvents.attemptId, attemptId))
        .orderBy(attemptEvents.sequence);
      return {
        state: toState(row, stored, version.scenario, version.contentHash),
        idempotent: false,
        published: version,
      };
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const bundle = await readBundle(attemptId);
    const matched = bundle.state.events.some((event) => event.idempotencyKey === idempotencyKey);
    if (!matched) {
      throw new SimulationError("CONFLICT", "La tentative a changé. Rechargez la page.");
    }
    return { ...bundle, idempotent: true };
  }
}

export async function createAttempt(input: {
  actor: Actor;
  slug: string;
}): Promise<{ state: AttemptState; published: PublishedScenario }> {
  if (!input.actor.userId && !input.actor.anonymousTokenHash) {
    throw new AppError("UNAUTHORIZED", "Session de démo manquante.", 401);
  }
  const published = await getPublishedBySlug(input.slug);
  if (!published) throw new AppError("NOT_FOUND", "Scénario introuvable.", 404);
  const db = getDb();
  const id = crypto.randomUUID();
  const state = startAttempt({
    id,
    scenario: published.scenario,
    scenarioVersionId: published.versionId,
    contentHash: published.contentHash,
  });
  await db.insert(attempts).values({
    id,
    userId: input.actor.userId,
    anonymousTokenHash: input.actor.userId ? null : input.actor.anonymousTokenHash,
    scenarioVersionId: published.versionId,
    status: state.status,
    expiresAt: input.actor.userId ? null : new Date(Date.now() + DEMO_TTL_MS),
  });
  await db.insert(attemptEvents).values(
    state.events.map((event) => ({
      attemptId: id,
      sequence: event.sequence,
      eventType: event.type,
      nodeId: event.nodeId,
      choiceId: event.choiceId,
      idempotencyKey: event.idempotencyKey,
      payloadJson: { effects: event.effects },
    })),
  );
  return { state, published };
}

export async function getOwnedAttempt(attemptId: string, actor: Actor) {
  const bundle = await readBundle(attemptId);
  assertOwner(bundle.row, actor);
  return bundle;
}

export async function applyAdvance(attemptId: string, actor: Actor, idempotencyKey: string) {
  const bundle = await getOwnedAttempt(attemptId, actor);
  const result = advance(bundle.state, bundle.published.scenario, idempotencyKey);
  if (result.idempotent) return { ...bundle, state: result.state, idempotent: true };
  const saved = await persistNewEvents(
    attemptId,
    bundle.state.events.length,
    result.state,
    idempotencyKey,
  );
  return saved;
}

export async function applyChoice(
  attemptId: string,
  actor: Actor,
  choiceId: string,
  idempotencyKey: string,
) {
  const bundle = await getOwnedAttempt(attemptId, actor);
  const result = commitChoice(bundle.state, bundle.published.scenario, choiceId, idempotencyKey);
  if (result.idempotent) return { ...bundle, state: result.state, idempotent: true };
  return persistNewEvents(attemptId, bundle.state.events.length, result.state, idempotencyKey);
}

export async function branchAttempt(attemptId: string, actor: Actor, fromSequence: number) {
  const bundle = await getOwnedAttempt(attemptId, actor);
  const before = JSON.stringify(bundle.state);
  const id = crypto.randomUUID();
  const child = replayFrom(bundle.state, bundle.published.scenario, fromSequence, id);
  if (JSON.stringify(bundle.state) !== before) {
    throw new Error("Le replay a modifié la tentative source.");
  }
  const db = getDb();
  await db.insert(attempts).values({
    id,
    userId: bundle.row.userId,
    anonymousTokenHash: bundle.row.anonymousTokenHash,
    scenarioVersionId: bundle.row.scenarioVersionId,
    parentAttemptId: bundle.row.id,
    branchFromSequence: fromSequence,
    status: child.status,
    expiresAt: bundle.row.expiresAt,
  });
  await db.insert(attemptEvents).values(
    child.events.map((event) => ({
      attemptId: id,
      sequence: event.sequence,
      eventType: event.type,
      nodeId: event.nodeId,
      choiceId: event.choiceId,
      idempotencyKey: event.idempotencyKey,
      payloadJson: { effects: event.effects },
    })),
  );
  return { state: child, published: bundle.published, idempotent: false };
}

export async function listOwnedAttempts(slug: string, actor: Actor) {
  const owner = actor.userId
    ? eq(attempts.userId, actor.userId)
    : actor.anonymousTokenHash
      ? and(isNull(attempts.userId), eq(attempts.anonymousTokenHash, actor.anonymousTokenHash))
      : sql`false`;
  const rows = await getDb()
    .select({
      id: attempts.id,
      status: attempts.status,
      finalScore: attempts.finalScore,
      parentAttemptId: attempts.parentAttemptId,
      startedAt: attempts.startedAt,
    })
    .from(attempts)
    .innerJoin(scenarioVersions, eq(attempts.scenarioVersionId, scenarioVersions.id))
    .innerJoin(scenarios, eq(scenarioVersions.scenarioId, scenarios.id))
    .where(and(eq(scenarios.slug, slug), owner))
    .orderBy(desc(attempts.startedAt));
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    finalScore: row.finalScore,
    parentAttemptId: row.parentAttemptId,
    startedAt: row.startedAt.toISOString(),
  }));
}

export async function saveTransferNote(attemptId: string, actor: Actor, note: string) {
  await getOwnedAttempt(attemptId, actor);
  const trimmed = note.trim().slice(0, 500);
  await getDb().update(attempts).set({ transferNote: trimmed }).where(eq(attempts.id, attemptId));
  return trimmed.length ? trimmed : null;
}

export async function recordAnalytics(input: {
  kind: string;
  scenarioDbId?: string | null;
  actor: Actor;
}) {
  try {
    await getDb().insert(analyticsEvents).values({
      kind: input.kind,
      scenarioId: input.scenarioDbId ?? null,
      anonymousId: input.actor.anonymousTokenHash,
      userId: input.actor.userId,
    });
  } catch (error) {
    console.error("analytics_write_failed", error instanceof Error ? error.name : "unknown");
  }
}

export async function recordAiUsage(input: { actor: Actor; status: "ok" | "fallback" | "error" }) {
  try {
    await getDb().insert(aiUsage).values({
      userId: input.actor.userId,
      requestType: "debrief",
      provider: "mock",
      model: "mock-v1",
      status: input.status,
    });
  } catch (error) {
    console.error("ai_usage_write_failed", error instanceof Error ? error.name : "unknown");
  }
}

export async function seedScenario(scenario: Scenario): Promise<{ inserted: boolean; hash: string }> {
  const parsed = parseScenario(scenario);
  const hash = contentHash(parsed);
  const db = getDb();
  const existingScenario = await db
    .select()
    .from(scenarios)
    .where(eq(scenarios.slug, parsed.slug))
    .limit(1);
  let scenarioId = existingScenario[0]?.id;
  if (!scenarioId) {
    const inserted = await db
      .insert(scenarios)
      .values({
        slug: parsed.slug,
        title: parsed.title,
        audience: parsed.audience,
        difficulty: parsed.difficulty,
        status: "published",
      })
      .returning({ id: scenarios.id });
    scenarioId = inserted[0]?.id;
  }
  if (!scenarioId) throw new Error("Impossible de créer le scénario.");

  const versions = await db
    .select()
    .from(scenarioVersions)
    .where(eq(scenarioVersions.scenarioId, scenarioId));
  const sameHash = versions.find((version) => version.contentHash === hash);
  if (sameHash) return { inserted: false, hash };
  const sameNumber = versions.find((version) => version.versionNumber === parsed.version);
  if (sameNumber) {
    throw new Error(
      `La version ${parsed.version} est déjà publiée avec un autre contenu. Créez une nouvelle version au lieu de modifier la version publiée.`,
    );
  }
  await db.insert(scenarioVersions).values({
    scenarioId,
    versionNumber: parsed.version,
    contentHash: hash,
    schemaVersion: parsed.schemaVersion,
    status: "published",
    contentJson: parsed,
    publishedAt: new Date(),
  });
  return { inserted: true, hash };
}

const DELETE_PHRASES = new Set(["supprimer mon compte", "delete my account"]);

async function assertActiveAccount(userId: string): Promise<void> {
  const rows = await getDb()
    .select({ deletedAt: user.deletedAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!rows[0] || rows[0].deletedAt) {
    throw new AppError("NOT_FOUND", "Compte introuvable.", 404);
  }
}

export async function listAccountHistory(actor: Actor) {
  if (!actor.userId) return [];
  await assertActiveAccount(actor.userId);
  const rows = await getDb()
    .select({
      id: attempts.id,
      status: attempts.status,
      finalScore: attempts.finalScore,
      startedAt: attempts.startedAt,
      slug: scenarios.slug,
      title: scenarios.title,
      versionNumber: scenarioVersions.versionNumber,
    })
    .from(attempts)
    .innerJoin(scenarioVersions, eq(attempts.scenarioVersionId, scenarioVersions.id))
    .innerJoin(scenarios, eq(scenarioVersions.scenarioId, scenarios.id))
    .where(eq(attempts.userId, actor.userId))
    .orderBy(desc(attempts.startedAt));
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    exerciseIndicator: row.finalScore,
    startedAt: row.startedAt.toISOString(),
    slug: row.slug,
    title: row.title,
    versionNumber: row.versionNumber,
  }));
}

export async function exportAccount(actor: Actor) {
  if (actor.userId) await assertActiveAccount(actor.userId);
  const owner = actor.userId
    ? eq(attempts.userId, actor.userId)
    : actor.anonymousTokenHash
      ? and(isNull(attempts.userId), eq(attempts.anonymousTokenHash, actor.anonymousTokenHash))
      : sql`false`;
  const db = getDb();
  const rows = await db
    .select({
      id: attempts.id,
      status: attempts.status,
      finalScore: attempts.finalScore,
      transferNote: attempts.transferNote,
      startedAt: attempts.startedAt,
      completedAt: attempts.completedAt,
      slug: scenarios.slug,
      title: scenarios.title,
      versionNumber: scenarioVersions.versionNumber,
    })
    .from(attempts)
    .innerJoin(scenarioVersions, eq(attempts.scenarioVersionId, scenarioVersions.id))
    .innerJoin(scenarios, eq(scenarioVersions.scenarioId, scenarios.id))
    .where(owner)
    .orderBy(desc(attempts.startedAt));
  const ids = rows.map((row) => row.id);
  const events = ids.length
    ? await db
        .select({
          attemptId: attemptEvents.attemptId,
          sequence: attemptEvents.sequence,
          eventType: attemptEvents.eventType,
          nodeId: attemptEvents.nodeId,
          choiceId: attemptEvents.choiceId,
        })
        .from(attemptEvents)
        .where(inArray(attemptEvents.attemptId, ids))
        .orderBy(attemptEvents.sequence)
    : [];
  let accountRow: { id: string; email: string; name: string } | null = null;
  if (actor.userId) {
    const found = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, actor.userId))
      .limit(1);
    accountRow = found[0] ?? null;
  }
  return {
    exportedAt: new Date().toISOString(),
    account: accountRow,
    attempts: rows.map((row) => ({
      id: row.id,
      scenarioSlug: row.slug,
      scenarioTitle: row.title,
      versionNumber: row.versionNumber,
      status: row.status,
      exerciseIndicator: row.finalScore,
      transferNote: row.transferNote,
      startedAt: row.startedAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
      events: events
        .filter((event) => event.attemptId === row.id)
        .map((event) => ({
          sequence: event.sequence,
          type: event.eventType,
          nodeId: event.nodeId,
          choiceId: event.choiceId,
        })),
    })),
  };
}

export async function deleteAccount(userId: string, phrase: string): Promise<void> {
  if (!DELETE_PHRASES.has(phrase.trim().toLowerCase())) {
    throw new AppError("INVALID_INPUT", "La confirmation ne correspond pas.", 400);
  }
  await assertActiveAccount(userId);
  const db = getDb();
  const versionsBefore = await db.select({ id: scenarioVersions.id }).from(scenarioVersions);
  await db.transaction(async (tx) => {
    const owned = await tx.select({ id: attempts.id }).from(attempts).where(eq(attempts.userId, userId));
    const ids = owned.map((row) => row.id);
    const eventRows = ids.length
      ? await tx
          .select({ value: count() })
          .from(attemptEvents)
          .where(inArray(attemptEvents.attemptId, ids))
      : [{ value: 0 }];
    await tx.insert(deletionJournal).values({
      userId,
      attemptCount: ids.length,
      eventCount: Number(eventRows[0]?.value ?? 0),
    });
    if (ids.length) {
      await tx.execute(sql`update attempts set parent_attempt_id = null where user_id = ${userId}`);
      await tx.delete(attempts).where(eq(attempts.userId, userId));
    }
    await tx.delete(session).where(eq(session.userId, userId));
    await tx.update(account).set({ password: null }).where(eq(account.userId, userId));
    await tx.update(user).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(user.id, userId));
  });
  const versionsAfter = await db.select({ id: scenarioVersions.id }).from(scenarioVersions);
  if (versionsAfter.length !== versionsBefore.length) {
    throw new Error("La suppression de compte a modifié les versions de scénario.");
  }
}

export async function purgeExpiredDeletions(): Promise<{ journals: number; users: number }> {
  const cutoff = new Date(Date.now() - accountRetentionDays() * 24 * 60 * 60 * 1000);
  const db = getDb();
  const oldJournals = await db
    .delete(deletionJournal)
    .where(lt(deletionJournal.createdAt, cutoff))
    .returning({ id: deletionJournal.id });
  const oldUsers = await db
    .select({ id: user.id })
    .from(user)
    .where(and(isNotNull(user.deletedAt), lt(user.deletedAt, cutoff)));
  for (const row of oldUsers) {
    await db.delete(session).where(eq(session.userId, row.id));
    await db.delete(account).where(eq(account.userId, row.id));
    await db.delete(user).where(eq(user.id, row.id));
  }
  return { journals: oldJournals.length, users: oldUsers.length };
}

export async function grantAdmin(email: string): Promise<"granted" | "missing"> {
  const normalized = email.trim().toLowerCase();
  const rows = await getDb()
    .update(user)
    .set({ role: "admin", updatedAt: new Date() })
    .where(and(sql`lower(${user.email}) = ${normalized}`, isNull(user.deletedAt)))
    .returning({ id: user.id });
  return rows.length > 0 ? "granted" : "missing";
}

export async function analyticsVolume() {
  const db = getDb();
  const kinds = await db
    .select({ kind: analyticsEvents.kind, count: count() })
    .from(analyticsEvents)
    .groupBy(analyticsEvents.kind);
  const accounts = await db.select({ value: count() }).from(user).where(isNull(user.deletedAt));
  const attemptRows = await db.select({ value: count() }).from(attempts);
  const completed = await db
    .select({ value: count() })
    .from(attempts)
    .where(eq(attempts.status, "completed"));
  return {
    accounts: Number(accounts[0]?.value ?? 0),
    attempts: Number(attemptRows[0]?.value ?? 0),
    completed: Number(completed[0]?.value ?? 0),
    kinds: kinds.map((row) => ({ kind: row.kind, count: Number(row.count) })),
  };
}

export async function publishedVersionIsImmutable(versionId: string): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    update scenario_versions
    set content_hash = 'tamper'
    where id = ${versionId} and status = 'published'
  `);
}
