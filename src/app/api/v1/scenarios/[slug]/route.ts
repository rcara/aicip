import { getPublishedBySlug, recordAnalytics } from "@/db/repository";
import { jsonError } from "@/lib/http";
import { currentActor } from "@/modules/identity/session";
import { presentScenario } from "@/modules/simulation/present";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const published = await getPublishedBySlug(slug);
    if (!published) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Scénario introuvable." } }, { status: 404 });
    }
    await recordAnalytics({
      kind: "scenario_viewed",
      scenarioDbId: published.scenarioDbId,
      actor: await currentActor(),
    });
    return Response.json({ scenario: presentScenario(published) });
  } catch (error) {
    return jsonError(error);
  }
}
