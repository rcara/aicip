import { and, desc, eq, isNull, sql } from "drizzle-orm";

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
import { aiUsage, analyticsEvents, attemptEvents, attempts, scenarioVersions, scenarios } from "./schema";

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

export async function publishedVersionIsImmutable(versionId: string): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    update scenario_versions
    set content_hash = 'tamper'
    where id = ${versionId} and status = 'published'
  `);
}
