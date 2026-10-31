import { notFound } from "next/navigation";

import { analyticsVolume } from "@/db/repository";
import { getMessages } from "@/lib/i18n";
import { ANALYTICS_KINDS } from "@/modules/analytics/kinds";
import { publishScenarioAction } from "@/modules/identity/publish";
import { getSessionUser, readLocale } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

const STATUSES = ["published", "unchanged", "invalid", "immutable"] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const current = await getSessionUser();
  const role = current && "role" in current ? current.role : null;
  if (role !== "admin") notFound();
  const messages = getMessages(await readLocale());
  const query = await searchParams;
  const status = STATUSES.find((item) => item === query.status) ?? null;
  const volume = await analyticsVolume();
  const counts = new Map(volume.kinds.map((item) => [item.kind, item.count]));

  return (
    <section className="max-w-3xl">
      <h1 className="font-serif text-5xl tracking-tight">{messages.admin.title}</h1>
      <p className="mt-3 text-sm text-ink-soft">{current?.email}</p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line p-4">
          <dt className="text-sm text-ink-soft">{messages.admin.accounts}</dt>
          <dd className="font-serif text-4xl">{volume.accounts}</dd>
        </div>
        <div className="rounded-3xl border border-line p-4">
          <dt className="text-sm text-ink-soft">{messages.admin.attempts}</dt>
          <dd className="font-serif text-4xl">{volume.attempts}</dd>
        </div>
        <div className="rounded-3xl border border-line p-4">
          <dt className="text-sm text-ink-soft">{messages.admin.completed}</dt>
          <dd className="font-serif text-4xl">{volume.completed}</dd>
        </div>
      </dl>
      <h2 className="mt-10 font-serif text-2xl">{messages.admin.kinds}</h2>
      <ul className="mt-3 divide-y divide-line rounded-3xl border border-line">
        {ANALYTICS_KINDS.map((kind) => (
          <li key={kind} className="flex items-center justify-between px-4 py-3">
            <span>{kind}</span>
            <span>{counts.get(kind) ?? 0}</span>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 font-serif text-2xl">{messages.admin.publish}</h2>
      <p className="mt-2 text-sm text-ink-soft">{messages.admin.publishHelp}</p>
      {status ? (
        <p className="mt-4" role="status">
          {messages.admin[status]}
        </p>
      ) : null}
      <form action={publishScenarioAction} className="mt-4">
        <label className="block text-sm" htmlFor="scenario-json">
          {messages.admin.scenarioJson}
        </label>
        <textarea
          className="mt-2 w-full rounded-2xl border border-line bg-white p-3 font-mono text-sm"
          id="scenario-json"
          name="scenario"
          required
          rows={12}
        />
        <button className="mt-4 rounded-full bg-accent px-5 py-3 text-accent-ink" type="submit">
          {messages.admin.submit}
        </button>
      </form>
    </section>
  );
}
