"use client";

import { useState } from "react";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

export function AccountMenu({ signIn, signOut }: { signIn: string; signOut: string }) {
  const { data, isPending } = authClient.useSession();
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return <span className="text-ink-soft">…</span>;
  }

  if (!data?.user) {
    return (
      <a className="underline-offset-4 hover:underline" href="/connexion">
        {signIn}
      </a>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <span className="max-w-36 truncate">{data.user.email}</span>
      <button
        className="underline-offset-4 hover:underline disabled:opacity-50"
        disabled={busy}
        type="button"
        onClick={() => {
          setBusy(true);
          void authClient.signOut().finally(() => setBusy(false));
        }}
      >
        {signOut}
      </button>
    </span>
  );
}
