import { sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { getAiCoachMode } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const ai = getAiCoachMode();
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok", database: "up", ai });
  } catch {
    return Response.json({ status: "degraded", database: "down", ai }, { status: 503 });
  }
}
