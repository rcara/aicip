export function LoadingStatus({ label = "Chargement…" }: { label?: string }) {
  return (
    <p role="status" className="text-ink-soft">
      {label}
    </p>
  );
}
