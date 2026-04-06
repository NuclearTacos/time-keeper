export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b text-sm">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-4">
          <span className="text-muted-foreground text-sm">timer</span>
          <span className="text-muted-foreground text-sm">report</span>
          <span className="font-semibold text-sm">sessions</span>
          <span className="text-muted-foreground text-sm">tags</span>
        </div>
      </nav>
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-6 animate-pulse">
        <div>
          <div className="h-4 w-16 bg-muted-foreground/20 rounded mb-3" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-32 bg-muted-foreground/10 rounded border" />
            <div className="h-3 w-4 bg-muted-foreground/10 rounded" />
            <div className="h-8 w-32 bg-muted-foreground/10 rounded border" />
          </div>
        </div>
        <ul className="divide-y">
          {[65, 80, 55, 70].map((w, i) => (
            <li key={i} className="py-3 space-y-1.5">
              <div className="h-3.5 bg-muted-foreground/20 rounded" style={{ width: `${w}%` }} />
              <div className="h-2.5 bg-muted-foreground/10 rounded w-24" />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
