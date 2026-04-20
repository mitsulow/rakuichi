interface StatusLineProps {
  statusLine: string | null;
}

export function StatusLine({ statusLine }: StatusLineProps) {
  if (!statusLine) return null;

  return (
    <div className="bg-gold-soft border border-gold/20 rounded-xl px-4 py-3 text-center">
      <p className="text-sm text-text">{statusLine}</p>
    </div>
  );
}
