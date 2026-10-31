import { z } from "zod";

import { deleteAccount } from "@/db/repository";
import { jsonError } from "@/lib/http";
import { getAuth, getSessionUser } from "@/modules/identity/session";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  phrase: z.string().max(80),
});

export async function POST(request: Request) {
  try {
    const current = await getSessionUser();
    if (!current) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Connectez-vous pour supprimer le compte." } },
        { status: 401 },
      );
    }
    const body = bodySchema.parse(await request.json());
    await deleteAccount(current.id, body.phrase);
    await getAuth().api.signOut({ headers: await headers() }).catch(() => undefined);
    return Response.json({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
