"use client";

import { useState } from "react";
import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";

import type { Messages } from "@/lib/i18n";

const authClient = createAuthClient();

export function AuthForm({ messages }: { messages: Messages }) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="max-w-md">
      <h1 className="font-serif text-5xl tracking-tight">{messages.auth.title}</h1>
      <p className="mt-3 text-ink-soft">{messages.auth.intro}</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const email = String(data.get("email") ?? "");
          const password = String(data.get("password") ?? "");
          const name = String(data.get("name") ?? "");
          setPending(true);
          setError(null);
          const action =
            mode === "sign-up"
              ? authClient.signUp.email({ email, password, name })
              : authClient.signIn.email({ email, password });
          void action
            .then((result) => {
              if (result.error) {
                setError(messages.auth.error);
                return;
              }
              router.push("/scenarios");
              router.refresh();
            })
            .catch(() => setError(messages.auth.error))
            .finally(() => setPending(false));
        }}
      >
        {mode === "sign-up" ? (
          <label className="block">
            <span className="text-sm">{messages.auth.name}</span>
            <input className="mt-1 w-full rounded-2xl border border-line bg-white px-3 py-2" name="name" required />
          </label>
        ) : null}
        <label className="block">
          <span className="text-sm">{messages.auth.email}</span>
          <input
            autoComplete="email"
            className="mt-1 w-full rounded-2xl border border-line bg-white px-3 py-2"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block">
          <span className="text-sm">{messages.auth.password}</span>
          <input
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            className="mt-1 w-full rounded-2xl border border-line bg-white px-3 py-2"
            minLength={12}
            name="password"
            required
            type="password"
          />
          <span className="mt-1 block text-sm text-ink-soft">{messages.auth.passwordHint}</span>
        </label>
        {error ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : null}
        <button className="rounded-full bg-ink px-5 py-3 text-paper-2 disabled:opacity-60" disabled={pending} type="submit">
          {mode === "sign-up" ? messages.auth.signUp : messages.auth.signIn}
        </button>
      </form>
      <button
        className="mt-4 text-sm underline"
        type="button"
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
      >
        {mode === "sign-in" ? messages.auth.switchSignUp : messages.auth.switchSignIn}
      </button>
    </div>
  );
}
