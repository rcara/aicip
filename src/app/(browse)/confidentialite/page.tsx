import { getMessages } from "@/lib/i18n";
import { readLocale } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const messages = getMessages(await readLocale());
  return (
    <article className="max-w-3xl">
      <h1 className="font-serif text-5xl tracking-tight">{messages.privacy.title}</h1>
      <p className="mt-4 text-lg">{messages.privacy.lead}</p>
      <div className="mt-8 space-y-6">
        {messages.privacy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-serif text-2xl">{section.heading}</h2>
            <p className="mt-2">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
