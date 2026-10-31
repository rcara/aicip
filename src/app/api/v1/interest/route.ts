import { z } from "zod";

import { saveInterest } from "@/db/repository";
import { allowRequest, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(200),
  message: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();
    if (!allowRequest(`interest:${email}`, 5, 60 * 60 * 1000)) {
      return Response.json(
        { error: { code: "RATE_LIMIT", message: "Trop d'envois pour cette adresse." } },
        { status: 429 },
      );
    }
    await saveInterest(email, body.message ?? null);
    return Response.json({ accepted: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
