import { AuthForm } from "@/components/auth-form";
import { getMessages } from "@/lib/i18n";
import { readLocale } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const messages = getMessages(await readLocale());
  return <AuthForm messages={messages} />;
}
