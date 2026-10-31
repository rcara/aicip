"use server";

import { cookies } from "next/headers";

import { cookieSecure } from "@/lib/config";
import { parseLocale } from "@/modules/identity/actor";

export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = parseLocale(String(formData.get("locale") ?? "fr"));
  const cookieStore = await cookies();
  cookieStore.set("aicip_locale", locale, {
    path: "/",
    sameSite: "lax",
    secure: cookieSecure(),
    maxAge: 60 * 60 * 24 * 365,
  });
}
