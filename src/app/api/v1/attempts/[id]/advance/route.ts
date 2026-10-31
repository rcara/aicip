import { applyAdvance } from "@/db/repository";
import { idempotencySchema, jsonError } from "@/lib/http";
import { currentActor } from "@/modules/identity/session";
import { presentAttempt } from "@/modules/simulation/present";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = idempotencySchema.parse(await request.json());
    const actor = await currentActor();
    const saved = await applyAdvance(id, actor, body.idempotencyKey);
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
