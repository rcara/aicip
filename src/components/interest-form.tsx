"use client";

import { useState } from "react";

import type { Messages } from "@/lib/i18n";

export function InterestForm({ messages }: { messages: Messages }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="rounded-3xl border border-line bg-paper-2 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        void fetch("/api/v1/interest", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, message }),
        })
          .then((response) => {
            if (!response.ok) {
              setError(messages.interest.error);
              return;
            }
            setDone(true);
          })
          .catch(() => setError(messages.interest.error))
          .finally(() => setPending(false));
      }}
    >
      <h2 className="font-serif text-3xl">{messages.interest.title}</h2>
      <p className="mt-3 max-w-2xl text-ink-soft">{messages.interest.body}</p>
      <label className="mt-6 block text-sm" htmlFor="interest-email">
        {messages.interest.email}
      </label>
      <input
        className="mt-1 w-full max-w-md rounded-2xl border border-line bg-white px-3 py-2"
        id="interest-email"
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <label className="mt-4 block text-sm" htmlFor="interest-message">
        {messages.interest.message}
      </label>
      <textarea
        className="mt-1 w-full rounded-2xl border border-line bg-white p-3"
        id="interest-message"
        maxLength={500}
        rows={3}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      {error ? (
        <p className="mt-3 text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {done ? <p className="mt-3 text-pine" role="status">{messages.interest.done}</p> : null}
      <button
        className="mt-4 rounded-full border border-ink px-5 py-3 disabled:opacity-60"
        disabled={pending || done}
        type="submit"
      >
        {messages.interest.submit}
      </button>
    </form>
  );
}
