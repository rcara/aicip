import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDb, getDb } from "@/db/client";
import {
  applyAdvance,
  applyChoice,
  createAttempt,
  deleteAccount,
  exportAccount,
  getOwnedAttempt,
  grantAdmin,
  listAccountHistory,
  purgeExpiredDeletions,
  saveInterest,
  saveTransferNote,
  seedScenario,
} from "@/db/repository";
import { seedPilot } from "@/db/seed";
import { attempts, deletionJournal, interestSignups, scenarioVersions, user } from "@/db/schema";
import type { Actor } from "@/modules/identity/actor";
import { parseScenario } from "@/modules/scenarios/schema";

const slug = "entretien-difficile-technicien-it";

describe("account privacy", () => {
  beforeAll(async () => {
    execFileSync("node", ["scripts/migrate.mjs"], { stdio: "inherit", env: process.env });
    await seedPilot();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("keeps a signed-in attempt on the user and hides it from another account", async () => {
    const db = getDb();
    const stamp = crypto.randomUUID();
    await db.insert(user).values([
      { id: `user-a-${stamp}`, name: "A", email: `a-${stamp}@example.com`, role: "learner" },
      { id: `user-b-${stamp}`, name: "B", email: `b-${stamp}@example.com`, role: "learner" },
    ]);
    const actorA: Actor = {
      userId: `user-a-${stamp}`,
      anonymousTokenHash: "should-not-be-stored",
      role: "learner",
    };
    const actorB: Actor = { userId: `user-b-${stamp}`, anonymousTokenHash: null, role: "learner" };
    const resumed: Actor = { userId: actorA.userId, anonymousTokenHash: null, role: "learner" };

    const created = await createAttempt({ actor: actorA, slug });
    const stored = (await db.select().from(attempts).where(eq(attempts.id, created.state.id)).limit(1))[0];
    expect(stored?.userId).toBe(actorA.userId);
    expect(stored?.anonymousTokenHash).toBeNull();
    await saveTransferNote(created.state.id, actorA, "note privée de A");
    const other = await createAttempt({ actor: actorB, slug });
    await saveTransferNote(other.state.id, actorB, "note privée de B");

    await expect(getOwnedAttempt(created.state.id, actorB)).rejects.toMatchObject({ status: 404 });
    const history = await listAccountHistory(resumed);
    expect(history.map((item) => item.id)).toContain(created.state.id);
    expect(history.map((item) => item.id)).not.toContain(other.state.id);

    const exported = await exportAccount(actorA);
    expect(exported.account?.email).toBe(`a-${stamp}@example.com`);
    expect(JSON.stringify(exported)).toContain("note privée de A");
    expect(JSON.stringify(exported)).not.toContain("note privée de B");
    expect(JSON.stringify(exported)).not.toContain("session");
    expect(exported.attempts[0]?.events[0]?.type).toBe("attempt_started");
  });

  it("deletes one account without touching the other or the published scenario", async () => {
    const db = getDb();
    const stamp = crypto.randomUUID();
    await db.insert(user).values([
      { id: `del-a-${stamp}`, name: "A", email: `del-a-${stamp}@example.com`, role: "learner" },
      { id: `del-b-${stamp}`, name: "B", email: `del-b-${stamp}@example.com`, role: "learner" },
    ]);
    const actorA: Actor = { userId: `del-a-${stamp}`, anonymousTokenHash: null, role: "learner" };
    const actorB: Actor = { userId: `del-b-${stamp}`, anonymousTokenHash: null, role: "learner" };
    const owned = await createAttempt({ actor: actorA, slug });
    const kept = await createAttempt({ actor: actorB, slug });
    await saveTransferNote(owned.state.id, actorA, "à effacer");
    const versionsBefore = await db.select({ id: scenarioVersions.id }).from(scenarioVersions);

    await expect(deleteAccount(actorA.userId!, "non")).rejects.toMatchObject({ status: 400 });
    await deleteAccount(actorA.userId!, "Supprimer mon compte");

    await expect(getOwnedAttempt(owned.state.id, actorA)).rejects.toMatchObject({ status: 404 });
    await expect(getOwnedAttempt(kept.state.id, actorB)).resolves.toMatchObject({
      state: { id: kept.state.id },
    });
    const versionsAfter = await db.select({ id: scenarioVersions.id }).from(scenarioVersions);
    expect(versionsAfter.map((row) => row.id).sort()).toEqual(versionsBefore.map((row) => row.id).sort());
    const journal = await db.select().from(deletionJournal).where(eq(deletionJournal.userId, actorA.userId!));
    expect(journal[0]?.attemptCount).toBe(1);
    expect(JSON.stringify(journal)).not.toContain("à effacer");
    const closed = await db.select().from(user).where(eq(user.id, actorA.userId!));
    expect(closed[0]?.deletedAt).toBeTruthy();
    expect(await grantAdmin(`del-a-${stamp}@example.com`)).toBe("missing");
  });

  it("publishes a new version without rewriting the pinned attempt", async () => {
    const db = getDb();
    const stamp = crypto.randomUUID();
    await db.insert(user).values({
      id: `pub-${stamp}`,
      name: "P",
      email: `pub-${stamp}@example.com`,
      role: "learner",
    });
    const actor: Actor = { userId: `pub-${stamp}`, anonymousTokenHash: null, role: "learner" };
    let current = await applyAdvance((await createAttempt({ actor, slug })).state.id, actor, crypto.randomUUID());
    for (const choiceId of ["d1_a", "d2_a", "d3_a"]) {
      const chosen = await applyChoice(current.state.id, actor, choiceId, crypto.randomUUID());
      if (chosen.state.status === "completed") {
        current = chosen;
        break;
      }
      const node = chosen.published.scenario.nodes.find((item) => item.id === chosen.state.currentNodeId);
      current = node?.type === "dialogue" ? await applyAdvance(chosen.state.id, actor, crypto.randomUUID()) : chosen;
    }
    expect((await getOwnedAttempt(current.state.id, actor)).row.finalScore).toBe(66);

    const raw = JSON.parse(readFileSync(new URL("../../docs/05_SCENARIO_PILOTE.json", import.meta.url), "utf8"));
    const mutated = parseScenario({ ...raw, title: "Titre modifié sans nouveau numéro" });
    await expect(seedScenario(mutated)).rejects.toThrow(/déjà publiée/);
    const next = parseScenario({
      ...raw,
      version: 2,
      briefing: "Version 2, le parcours déjà joué reste sur la version 1.",
    });
    const published = await seedScenario(next);
    expect(published.inserted).toBe(true);
    const pinned = await getOwnedAttempt(current.state.id, actor);
    expect(pinned.row.finalScore).toBe(66);
    expect(pinned.published.scenario.version).toBe(1);
    await db.delete(scenarioVersions).where(sql`${scenarioVersions.versionNumber} > 1`);
  });

  it("stores an interest note without an exercise indicator", async () => {
    const email = `interest-${crypto.randomUUID()}@example.com`;
    await saveInterest(email, "Curieux du format, pas d'un score.");
    const rows = await getDb().select().from(interestSignups).where(eq(interestSignups.email, email));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.message).toContain("format");
    expect(JSON.stringify(rows[0])).not.toContain("finalScore");
    expect(JSON.stringify(rows[0])).not.toContain("exerciseIndicator");
  });

  it("grants admin only to an existing account and purges old deletion rows", async () => {
    const db = getDb();
    const stamp = crypto.randomUUID();
    expect(await grantAdmin(`absent-${stamp}@example.com`)).toBe("missing");
    await db.insert(user).values({
      id: `admin-${stamp}`,
      name: "Admin",
      email: `admin-${stamp}@example.com`,
      role: "learner",
    });
    expect(await grantAdmin(`admin-${stamp}@example.com`)).toBe("granted");
    const promoted = await db.select().from(user).where(eq(user.id, `admin-${stamp}`));
    expect(promoted[0]?.role).toBe("admin");

    const old = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    await db.insert(user).values({
      id: `old-${stamp}`,
      name: "Old",
      email: `old-${stamp}@example.com`,
      role: "learner",
      deletedAt: old,
    });
    await db.insert(deletionJournal).values({
      userId: `old-${stamp}`,
      attemptCount: 0,
      eventCount: 0,
      createdAt: old,
    });
    await db.insert(deletionJournal).values({
      userId: `keep-${stamp}`,
      attemptCount: 0,
      eventCount: 0,
    });
    const purged = await purgeExpiredDeletions();
    expect(purged.users).toBeGreaterThanOrEqual(1);
    expect(purged.journals).toBeGreaterThanOrEqual(1);
    const remaining = await db.select().from(deletionJournal).where(eq(deletionJournal.userId, `keep-${stamp}`));
    expect(remaining).toHaveLength(1);
    const gone = await db.select().from(user).where(eq(user.id, `old-${stamp}`));
    expect(gone).toHaveLength(0);
  });
});
