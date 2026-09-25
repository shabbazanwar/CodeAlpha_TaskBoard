/** Board skeleton shown while the project loads. */
export default function LoadingBoard() {
  const shimmer = "animate-pulse rounded-xl bg-ink-100";

  return (
    <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-6" aria-busy="true">
      <div className={`h-3 w-24 ${shimmer}`} />
      <div className={`mt-3 h-8 w-64 ${shimmer}`} />
      <div className={`mt-3 h-4 w-96 max-w-full ${shimmer}`} />

      <div className="mt-7 flex items-start gap-4 overflow-x-auto pb-4">
        {[3, 2, 1].map((cards, column) => (
          <div key={column} className="w-[19rem] shrink-0 rounded-2xl border border-white/70 bg-ink-100/60 p-3">
            <div className={`h-4 w-28 ${shimmer}`} />
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: cards }, (_, card) => (
                <div key={card} className="h-24 animate-pulse rounded-xl bg-white shadow-card" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
