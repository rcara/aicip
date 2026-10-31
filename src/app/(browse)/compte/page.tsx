import Link from "next/link";

import { DeleteAccountForm } from "@/components/delete-account-form";
import { listAccountHistory } from "@/db/repository";
import { getMessages } from "@/lib/i18n";
import { currentActor, readLocale } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const messages = getMessages(await readLocale());
  const actor = await currentActor();

  if (!actor.userId) {
    return (
      <section className="max-w-2xl">
        <h1 className="font-serif text-5xl tracking-tight">{messages.account.title}</h1>
        <p className="mt-4 text-ink-soft">{messages.account.anonymous}</p>
        <Link className="mt-6 inline-block underline" href="/connexion">
          {messages.account.signIn}
        </Link>
      </section>
    );
  }

  const history = await listAccountHistory(actor);

  return (
    <section className="max-w-3xl">
      <h1 className="font-serif text-5xl tracking-tight">{messages.account.title}</h1>
      <p className="mt-4 text-ink-soft">{messages.account.intro}</p>
      <p className="mt-3 text-sm text-ink-soft">{messages.account.anonymous}</p>
      {history.length === 0 ? <p className="mt-8">{messages.account.empty}</p> : null}
      <ul className="mt-8 divide-y divide-line rounded-3xl border border-line">
        {history.map((attempt) => (
          <li key={attempt.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{attempt.title}</p>
              <p className="text-sm text-ink-soft">
                v{attempt.versionNumber} · {attempt.status}
                {attempt.exerciseIndicator !== null
                  ? ` · ${messages.account.indicator} ${attempt.exerciseIndicator}`
                  : ""}
              </p>
            </div>
            <Link className="underline" href={`/demo/${attempt.slug}?attempt=${attempt.id}`}>
              {messages.account.resume}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8">
        <a className="rounded-full bg-ink px-5 py-3 text-paper-2" href="/api/v1/account/export">
          {messages.account.export}
        </a>
      </p>
      <DeleteAccountForm messages={messages} />
    </section>
  );
}
