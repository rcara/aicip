import { branchAttempt, recordAnalytics } from "@/db/repository";
import { jsonError, replaySchema } from "@/lib/http";
import { currentActor } from "@/modules/identity/session";
import { presentAttempt } from "@/modules/simulation/present";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = replaySchema.parse(await request.json());
    const actor = await currentActor();
    const saved = await branchAttempt(id, actor, body.fromSequence);
    await recordAnalytics({
      kind: "replay_started",
      scenarioDbId: saved.published.scenarioDbId,
      actor,
    });
    const attempt = await presentAttempt({
      state: saved.state,
      scenario: saved.published.scenario,
      slug: saved.published.slug,
      actor,
    });
    return Response.json({ attempt }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
