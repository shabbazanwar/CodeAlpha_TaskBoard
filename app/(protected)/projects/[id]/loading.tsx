/** Board skeleton shown while the project loads. */
export default function LoadingBoard() {
  return (
    <main className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6" aria-busy="true">
      <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200" />

      <div className="mt-6 flex items-start gap-4 overflow-x-auto pb-4">
        {[3, 2, 1].map((cards, column) => (
          <div key={column} className="w-72 shrink-0 rounded-lg bg-slate-100 p-3">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: cards }, (_, card) => (
                <div key={card} className="h-20 animate-pulse rounded-md bg-white" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
