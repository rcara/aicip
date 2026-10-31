import { saveTransferNote } from "@/db/repository";
import { jsonError, transferSchema } from "@/lib/http";
import { currentActor } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = transferSchema.parse(await request.json());
    const note = await saveTransferNote(id, await currentActor(), body.note);
    return Response.json({ note });
  } catch (error) {
    return jsonError(error);
  }
}
