/** Brand mark: three kanban columns inside a gradient tile. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-glow ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="none">
        <rect x="3" y="4" width="4.6" height="16" rx="1.6" fill="white" fillOpacity="0.95" />
        <rect x="9.7" y="4" width="4.6" height="10.5" rx="1.6" fill="white" fillOpacity="0.75" />
        <rect x="16.4" y="4" width="4.6" height="6.5" rx="1.6" fill="white" fillOpacity="0.55" />
      </svg>
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight text-ink-900">
        Task<span className="gradient-text">Board</span>
      </span>
    </span>
  );
}
