type Props = { href: string; children: React.ReactNode };

/** Same-page anchor chip (no detail pages exist yet). */
export function Chip({ href, children }: Props) {
  return (
    <a
      href={href}
      className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:border-accent/50 hover:text-accent"
    >
      {children}
    </a>
  );
}
