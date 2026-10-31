import { getOwnedAttempt, recordAnalytics } from "@/db/repository";
import { jsonError } from "@/lib/http";
import { currentActor } from "@/modules/identity/session";
import { presentAttempt } from "@/modules/simulation/present";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const actor = await currentActor();
    const bundle = await getOwnedAttempt(id, actor);
    if (bundle.state.status === "completed") {
      await recordAnalytics({
        kind: "feedback_viewed",
        scenarioDbId: bundle.published.scenarioDbId,
        actor,
      });
    }
    const attempt = await presentAttempt({
      state: bundle.state,
      scenario: bundle.published.scenario,
      slug: bundle.published.slug,
      actor,
    });
    return Response.json({ attempt });
  } catch (error) {
    return jsonError(error);
  }
}
