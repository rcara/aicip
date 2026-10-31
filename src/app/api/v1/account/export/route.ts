import { exportAccount } from "@/db/repository";
import { jsonError } from "@/lib/http";
import { currentActor } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await currentActor();
    if (!actor.userId && !actor.anonymousTokenHash) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Aucune session à exporter." } },
        { status: 401 },
      );
    }
    const body = await exportAccount(actor);
    return Response.json(body, {
      headers: {
        "content-disposition": "attachment; filename=\"aicip-export.json\"",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
