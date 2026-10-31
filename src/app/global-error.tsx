"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
          <h1>Une erreur est survenue.</h1>
          <p>{error.digest ?? "La page n'a pas pu s'afficher."}</p>
          <button type="button" onClick={() => reset()}>
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
