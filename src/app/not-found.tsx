import Link from "next/link";

import { getMessages } from "@/lib/i18n";

export default function NotFound() {
  const fr = getMessages("fr");
  const en = getMessages("en");
  return (
    <div>
      <h1 className="font-serif text-4xl">
        <span className="locale-fr">{fr.errors.notFound}</span>
        <span className="locale-en">{en.errors.notFound}</span>
      </h1>
      <Link className="locale-fr mt-4 inline-block underline" href="/">
        {fr.errors.backHome}
      </Link>
      <Link className="locale-en mt-4 inline-block underline" href="/">
        {en.errors.backHome}
      </Link>
    </div>
  );
}
