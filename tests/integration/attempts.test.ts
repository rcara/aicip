import { execFileSync } from "node:child_process";

import { eq, gt, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { closeDb, getDb } from "@/db/client";
import { seedPilot } from "@/db/seed";
import {
  applyAdvance,
  applyChoice,
  branchAttempt,
  createAttempt,
  getOwnedAttempt,
  publishedVersionIsImmutable,
  saveReflection,
} from "@/db/repository";
import { attemptEvents, attempts, scenarioVersions } from "@/db/schema";
import { contentHash } from "@/modules/scenarios/hash";
import type { Actor } from "@/modules/identity/actor";
import { computeFeedback } from "@/modules/learning/feedback";

const actorA: Actor = { userId: null, anonymousTokenHash: "a".repeat(64), role: null };
const actorB: Actor = { userId: null, anonymousTokenHash: "b".repeat(64), role: null };
const slug = "entretien-difficile-technicien-it";

async function reachFirstDecision(actor: Actor) {
  const created = await createAttempt({ actor, slug });
  const advanced = await applyAdvance(created.state.id, actor, crypto.randomUUID());
  return advanced;
}

describe("persisted attempts", () => {
  beforeAll(async () => {
    execFileSync("node", ["scripts/migrate.mjs"], { stdio: "inherit", env: process.env });
    await seedPilot();
  });

  beforeEach(async () => {
    const db = getDb();
    await db.execute(sql`update attempts set parent_attempt_id = null`);
    await db.delete(attemptEvents);
    await db.delete(attempts);
    await db.delete(scenarioVersions).where(gt(scenarioVersions.versionNumber, 1));
  });

  afterAll(async () => {
    await closeDb();
  });

  it("stores one event when the same choice is submitted twice", async () => {
    const started = await reachFirstDecision(actorA);
    const key = crypto.randomUUID();
    const [first, second] = await Promise.all([
      applyChoice(started.state.id, actorA, "d1_a", key),
      applyChoice(started.state.id, actorA, "d1_a", key),
    ]);
    expect(first.state.currentNodeId).toBe("d2_cooperative");
    expect(second.state.currentNodeId).toBe("d2_cooperative");
    const rows = await getDb()
      .select()
      .from(attemptEvents)
      .where(eq(attemptEvents.attemptId, started.state.id));
    expect(rows.filter((row) => row.eventType === "choice_committed")).toHaveLength(1);
  });

  it("stores a free reply without moving the node or the score", async () => {
    const started = await reachFirstDecision(actorA);
    const before = await getOwnedAttempt(started.state.id, actorA);
    const note = await saveReflection(started.state.id, actorA, "Je nommerais le ticket A, puis une date.");
    const after = await getOwnedAttempt(started.state.id, actorA);
    expect(note).toBe("Je nommerais le ticket A, puis une date.");
    expect(after.state.currentNodeId).toBe(before.state.currentNodeId);
    expect(after.state.events).toHaveLength(before.state.events.length);
    expect(after.row.finalScore).toBe(before.row.finalScore);
    const chosen = await applyChoice(started.state.id, actorA, "d1_a", crypto.randomUUID());
    expect(chosen.state.currentNodeId).toBe("d2_cooperative");
  });

  it("hides an attempt from another actor", async () => {
    const started = await reachFirstDecision(actorA);
    await expect(getOwnedAttempt(started.state.id, actorB)).rejects.toMatchObject({ status: 404 });
  });

  it("keeps the original attempt when replaying", async () => {
    let current = await reachFirstDecision(actorA);
    for (const choiceId of ["d1_a", "d2_a", "d3_a"]) {
      const chosen = await applyChoice(current.state.id, actorA, choiceId, crypto.randomUUID());
      current = chosen;
      if (chosen.state.status === "completed") break;
      const node = chosen.published.scenario.nodes.find((item) => item.id === chosen.state.currentNodeId);
      if (node?.type === "dialogue") {
        current = await applyAdvance(chosen.state.id, actorA, crypto.randomUUID());
      }
    }
    expect(current.state.status).toBe("completed");
    const feedback = computeFeedback(current.published.scenario, current.state);
    expect(feedback.exerciseIndicator).toBe(66);
    const stored = await getOwnedAttempt(current.state.id, actorA);
    expect(stored.row.finalScore).toBe(66);
    const parentEvents = stored.state.events.length;
    const child = await branchAttempt(current.state.id, actorA, 2);
    const parentAfter = await getOwnedAttempt(current.state.id, actorA);
    expect(parentAfter.state.events).toHaveLength(parentEvents);
    expect(parentAfter.state.status).toBe("completed");
    expect(child.state.parentAttemptId).toBe(current.state.id);
    expect(child.state.scenarioVersionId).toBe(parentAfter.state.scenarioVersionId);
    expect(child.state.events.length).toBeLessThan(parentEvents);
  });

  it("follows the version pinned at the start after a newer publication", async () => {
    const started = await reachFirstDecision(actorA);
    const published = started.published;
    const mutated = structuredClone(published.scenario);
    mutated.version = 2;
    const decision = mutated.nodes.find((node) => node.id === "d1");
    if (decision?.type === "decision") {
      const choice = decision.choices.find((item) => item.id === "d1_a");
      if (choice) choice.nextNodeId = "ending_unclear";
    }
    await getDb().insert(scenarioVersions).values({
      scenarioId: published.scenarioDbId,
      versionNumber: 2,
      contentHash: contentHash(mutated),
      schemaVersion: 1,
      status: "published",
      contentJson: mutated,
      publishedAt: new Date(),
    });
    const chosen = await applyChoice(started.state.id, actorA, "d1_a", crypto.randomUUID());
    expect(chosen.state.scenarioVersionId).toBe(published.versionId);
    expect(chosen.state.currentNodeId).toBe("d2_cooperative");
    await getDb().delete(scenarioVersions).where(eq(scenarioVersions.versionNumber, 2));
  });

  it("refuses to rewrite a published scenario version", async () => {
    const started = await reachFirstDecision(actorA);
    let thrown = "";
    try {
      await publishedVersionIsImmutable(started.published.versionId);
    } catch (error) {
      thrown = errorText(error);
    }
    expect(thrown).toMatch(/immutable/i);
    const version = await getDb()
      .select()
      .from(scenarioVersions)
      .where(eq(scenarioVersions.id, started.published.versionId));
    expect(version[0]?.contentHash).toBe(started.published.contentHash);
  });
});

function errorText(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const message = "message" in error ? String(error.message) : "";
  const cause = "cause" in error ? errorText(error.cause) : "";
  return `${message} ${cause}`;
}
