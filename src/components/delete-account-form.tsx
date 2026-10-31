"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Messages } from "@/lib/i18n";

export function DeleteAccountForm({ messages }: { messages: Messages }) {
  const router = useRouter();
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const ready = phrase.trim().toLowerCase() === messages.account.confirmPhrase;

  return (
    <form
      className="mt-8 max-w-xl rounded-3xl border border-line p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;
        setPending(true);
        setError(null);
        void fetch("/api/v1/account/delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phrase }),
        })
          .then(async (response) => {
            if (!response.ok) {
              setError(messages.errors.generic);
              return;
            }
            router.push("/?compte=supprime");
            router.refresh();
          })
          .catch(() => setError(messages.errors.generic))
          .finally(() => setPending(false));
      }}
    >
      <h2 className="font-serif text-2xl">{messages.account.delete}</h2>
      <p className="mt-2 text-sm text-ink-soft">{messages.account.deleteHelp}</p>
      <label className="mt-4 block text-sm" htmlFor="delete-phrase">
        {messages.account.confirmLabel}
        <span className="mt-1 block font-semibold">{messages.account.confirmPhrase}</span>
      </label>
      <input
        className="mt-2 w-full rounded-2xl border border-line bg-white px-3 py-2"
        id="delete-phrase"
        autoComplete="off"
        value={phrase}
        onChange={(event) => setPhrase(event.target.value)}
      />
      {error ? (
        <p className="mt-3 text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="mt-4 rounded-full border border-danger px-4 py-2 text-danger disabled:opacity-50"
        disabled={!ready || pending}
        type="submit"
      >
        {messages.account.delete}
      </button>
    </form>
  );
}
