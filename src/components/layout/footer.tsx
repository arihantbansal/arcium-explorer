import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-primary bg-bg-surface">
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-accent-arcium/20">
            <span className="text-[10px] font-bold text-accent-arcium">A</span>
          </div>
          <span>Arcium Explorer</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <Link
            href="/api/v1/stats"
            className="hover:text-text-secondary transition-colors"
          >
            API
          </Link>
          <a
            href="https://docs.arcium.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
          >
            Docs
          </a>
          <a
            href="https://arcium.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
          >
            Arcium
          </a>
        </div>
      </div>
    </footer>
  );
}
