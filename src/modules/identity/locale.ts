"use server";

import { cookies } from "next/headers";

import { parseLocale } from "@/modules/identity/actor";

export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = parseLocale(String(formData.get("locale") ?? "fr"));
  const cookieStore = await cookies();
  cookieStore.set("aicip_locale", locale, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}
