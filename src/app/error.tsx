"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("page_error", error.digest ?? error.name);
  }, [error]);

  return (
    <div role="alert">
      <h1 className="font-serif text-4xl">Une erreur est survenue.</h1>
      <button className="mt-4 underline" type="button" onClick={() => reset()}>
        Réessayer
      </button>
    </div>
  );
}
