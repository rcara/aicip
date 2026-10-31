import { cookies, headers } from "next/headers";

import { authBaseUrl, cookieSecure, requireAuthSecret } from "@/lib/config";
import { getDb } from "@/db/client";
import { account, session, user, verification } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  DEMO_COOKIE,
  hashDemoToken,
  newDemoToken,
  parseLocale,
  type Actor,
  type Locale,
} from "@/modules/identity/actor";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

function createAuth() {
  const baseURL = authBaseUrl();
  return betterAuth({
    appName: "Interactive Soft Skills Academy",
    baseURL,
    secret: requireAuthSecret(),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      camelCase: false,
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 12,
    },
    user: {
      additionalFields: {
        locale: {
          type: "string",
          required: false,
          defaultValue: "fr",
          input: true,
        },
        role: {
          type: "string",
          required: false,
          defaultValue: "learner",
          input: false,
        },
      },
    },
    trustedOrigins: [baseURL, "http://localhost:3000", "http://127.0.0.1:3000"],
    advanced: { useSecureCookies: cookieSecure() },
    plugins: [nextCookies()],
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | null = null;

export function getAuth(): AuthInstance {
  if (!authInstance) authInstance = createAuth();
  return authInstance;
}

export async function getSessionUser() {
  try {
    const result = await getAuth().api.getSession({ headers: await headers() });
    const current = result?.user;
    if (!current) return null;
    const rows = await getDb()
      .select({ deletedAt: user.deletedAt })
      .from(user)
      .where(eq(user.id, current.id))
      .limit(1);
    if (!rows[0] || rows[0].deletedAt) return null;
    return current;
  } catch (error) {
    console.error("session_unavailable", error instanceof Error ? error.name : "unknown");
    return null;
  }
}

export async function readLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get("aicip_locale")?.value);
}

export async function currentActor(): Promise<Actor> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEMO_COOKIE)?.value ?? null;
  const current = await getSessionUser();
  const role = current && "role" in current && current.role === "admin" ? "admin" : current ? "learner" : null;
  return {
    userId: current?.id ?? null,
    anonymousTokenHash: current ? null : token ? hashDemoToken(token) : null,
    role,
  };
}

export async function actorWithDemoCookie(): Promise<Actor> {
  const cookieStore = await cookies();
  let token = cookieStore.get(DEMO_COOKIE)?.value;
  if (!token) {
    token = newDemoToken();
    cookieStore.set(DEMO_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure(),
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  const current = await getSessionUser();
  return {
    userId: current?.id ?? null,
    anonymousTokenHash: current ? null : hashDemoToken(token),
    role: current && "role" in current && current.role === "admin" ? "admin" : current ? "learner" : null,
  };
}
