import { getOwnedAttempt, saveReflection } from "@/db/repository";
import { jsonError, transferSchema } from "@/lib/http";
import { currentActor } from "@/modules/identity/session";
import { presentAttempt } from "@/modules/simulation/present";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = transferSchema.parse(await request.json());
    const actor = await currentActor();
    await saveReflection(id, actor, body.note);
    const bundle = await getOwnedAttempt(id, actor);
    const attempt = await presentAttempt({
      state: bundle.state,
      scenario: bundle.published.scenario,
      slug: bundle.published.slug,
      actor,
    });
    return Response.json({ attempt, reflectionNote: attempt.reflectionNote });
  } catch (error) {
    return jsonError(error);
  }
}
