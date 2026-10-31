import { notFound } from "next/navigation";

import { getMessages } from "@/lib/i18n";
import { getSessionUser, readLocale } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  const role = user && "role" in user ? user.role : null;
  if (role !== "admin") notFound();
  const messages = getMessages(await readLocale());
  return (
    <section>
      <h1 className="font-serif text-4xl">{messages.admin.title}</h1>
      <p className="mt-3">{user?.email}</p>
    </section>
  );
}
