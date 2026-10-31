import { countAiUsageToday, getOwnedAttempt, recordAiUsage, recordAnalytics } from "@/db/repository";
import { getAiCoachMode, getRealCoachConfig } from "@/lib/config";
import { coachSchema, jsonError } from "@/lib/http";
import { computeFeedback } from "@/modules/learning/feedback";
import { runCoach } from "@/modules/ai-coach/provider";
import { currentActor } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = coachSchema.parse(await request.json().catch(() => ({})));
    const actor = await currentActor();
    const bundle = await getOwnedAttempt(id, actor);
    const before = bundle.row.finalScore;
    const feedback = computeFeedback(bundle.published.scenario, bundle.state);
    const mode = getAiCoachMode();
    await recordAnalytics({ kind: "ai_request", scenarioDbId: bundle.published.scenarioDbId, actor });
    const result = await runCoach(
      {
        feedback,
        question: body.question,
        briefing: bundle.published.scenario.briefing,
        objective: bundle.published.scenario.objective,
        guidelines: bundle.published.scenario.feedback.coachGuidelines,
        reflectionNote: bundle.row.reflectionNote ?? undefined,
      },
      mode,
      { config: getRealCoachConfig(), usage: await countAiUsageToday(actor) },
    );
    if (!result) {
      return Response.json({ coach: null });
    }
    await recordAiUsage({
      actor,
      status: result.source === "fallback" ? "fallback" : "ok",
      provider: result.provider,
      model: result.model,
    });
    const after = (await getOwnedAttempt(id, actor)).row.finalScore;
    if (after !== before) {
      throw new Error("Le coach a modifié un indicateur persisté.");
    }
    return Response.json({ coach: result });
  } catch (error) {
    const actor = await currentActor().catch(() => null);
    if (actor) await recordAiUsage({ actor, status: "error", provider: "mock", model: "mock-v1" });
    await recordAnalytics({
      kind: "ai_error",
      actor: actor ?? { userId: null, anonymousTokenHash: null, role: null },
    });
    return jsonError(error);
  }
}
