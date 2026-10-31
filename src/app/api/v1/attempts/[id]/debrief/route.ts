import { computeFeedback } from "@/modules/learning/feedback";
import { getOwnedAttempt, recordAnalytics } from "@/db/repository";
import { jsonError } from "@/lib/http";
import { currentActor } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const actor = await currentActor();
    const bundle = await getOwnedAttempt(id, actor);
    const feedback = computeFeedback(bundle.published.scenario, bundle.state);
    await recordAnalytics({
      kind: "feedback_viewed",
      scenarioDbId: bundle.published.scenarioDbId,
      actor,
    });
    return Response.json({
      feedback,
      storedIndicator: bundle.row.finalScore,
      contentHash: bundle.published.contentHash,
      scenarioVersionId: bundle.state.scenarioVersionId,
    });
  } catch (error) {
    return jsonError(error);
  }
}
