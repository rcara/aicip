import { z } from "zod";

import { createAttempt, listOwnedAttempts, recordAnalytics } from "@/db/repository";
import { allowRequest, jsonError } from "@/lib/http";
import { actorWithDemoCookie } from "@/modules/identity/session";
import { presentAttempt } from "@/modules/simulation/present";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ slug: z.string().min(1).max(80) });

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("slug") ?? "";
    const actor = await actorWithDemoCookie();
    const attempts = slug ? await listOwnedAttempts(slug, actor) : [];
    return Response.json({ attempts });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await actorWithDemoCookie();
    const key = actor.userId ?? actor.anonymousTokenHash ?? "anonymous";
    if (!allowRequest(`start:${key}`, 30, 10 * 60 * 1000)) {
      return Response.json(
        { error: { code: "RATE_LIMIT", message: "Trop de tentatives. Réessayez dans quelques minutes." } },
        { status: 429 },
      );
    }
    const body = bodySchema.parse(await request.json());
    const created = await createAttempt({ actor, slug: body.slug });
    await recordAnalytics({
      kind: "attempt_started",
      scenarioDbId: created.published.scenarioDbId,
      actor,
    });
    const attempt = await presentAttempt({
      state: created.state,
      scenario: created.published.scenario,
      slug: created.published.slug,
      actor,
    });
    return Response.json({ attempt }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
