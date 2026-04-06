export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b text-sm">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-4">
          <span className="font-semibold text-sm">timer</span>
          <span className="text-muted-foreground text-sm">report</span>
          <span className="text-muted-foreground text-sm">sessions</span>
          <span className="text-muted-foreground text-sm">tags</span>
        </div>
      </nav>
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6 animate-pulse">
        {/* ActiveTimer skeleton */}
        <div className="border rounded-md p-4 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
              <div className="h-3 bg-muted-foreground/10 rounded w-1/3" />
            </div>
            <div className="h-7 w-16 bg-muted-foreground/20 rounded shrink-0" />
          </div>
        </div>
        {/* Input skeleton */}
        <div className="h-9 bg-muted-foreground/10 rounded border" />
        {/* Recent list skeleton */}
        <section>
          <div className="h-2.5 w-12 bg-muted-foreground/10 rounded mb-2" />
          <ul className="divide-y">
            {[70, 50, 85].map((w, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-3 bg-muted-foreground/20 rounded" style={{ width: `${w}%` }} />
                  <div className="h-2.5 bg-muted-foreground/10 rounded w-1/3" />
                </div>
                <div className="h-6 w-14 bg-muted-foreground/10 rounded border shrink-0" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
