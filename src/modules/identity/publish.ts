"use server";

import { redirect } from "next/navigation";

import { seedScenario } from "@/db/repository";
import { parseScenario, ScenarioValidationError } from "@/modules/scenarios/schema";
import { getSessionUser } from "@/modules/identity/session";

export async function publishScenarioAction(formData: FormData) {
  const current = await getSessionUser();
  const role = current && "role" in current ? current.role : null;
  if (role !== "admin") redirect("/admin");
  const raw = String(formData.get("scenario") ?? "");
  try {
    const result = await seedScenario(parseScenario(JSON.parse(raw)));
    redirect(result.inserted ? "/admin?status=published" : "/admin?status=unchanged");
  } catch (error) {
    if (error instanceof ScenarioValidationError || error instanceof SyntaxError) {
      redirect("/admin?status=invalid");
    }
    if (error instanceof Error && error.message.includes("déjà publiée")) {
      redirect("/admin?status=immutable");
    }
    throw error;
  }
}
