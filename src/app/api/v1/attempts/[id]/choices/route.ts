import { applyChoice, recordAnalytics } from "@/db/repository";
import { choiceSchema, jsonError } from "@/lib/http";
import { currentActor } from "@/modules/identity/session";
import { presentAttempt } from "@/modules/simulation/present";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = choiceSchema.parse(await request.json());
    const actor = await currentActor();
    const saved = await applyChoice(id, actor, body.choiceId, body.idempotencyKey);
    if (!saved.idempotent) {
      await recordAnalytics({
        kind: "decision_committed",
        scenarioDbId: saved.published.scenarioDbId,
        actor,
      });
      if (saved.state.status === "completed") {
        await recordAnalytics({
          kind: "attempt_completed",
          scenarioDbId: saved.published.scenarioDbId,
          actor,
        });
      }
    }
    const attempt = await presentAttempt({
      state: saved.state,
      scenario: saved.published.scenario,
      slug: saved.published.slug,
      actor,
    });
    return Response.json({ attempt, idempotent: saved.idempotent });
  } catch (error) {
    return jsonError(error);
  }
}
