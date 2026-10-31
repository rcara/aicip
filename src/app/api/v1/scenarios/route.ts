import { listPublishedScenarios } from "@/db/repository";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scenarios = await listPublishedScenarios();
    return Response.json({ scenarios });
  } catch (error) {
    return jsonError(error);
  }
}
