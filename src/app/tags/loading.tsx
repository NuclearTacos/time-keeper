export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b text-sm">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-4">
          <span className="text-muted-foreground text-sm">timer</span>
          <span className="text-muted-foreground text-sm">report</span>
          <span className="text-muted-foreground text-sm">sessions</span>
          <span className="font-semibold text-sm">tags</span>
        </div>
      </nav>
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-4 w-8 bg-muted-foreground/20 rounded" />
        <div className="h-3 w-72 bg-muted-foreground/10 rounded" />
        <ul className="divide-y">
          {[60, 75, 90, 65].map((w, i) => (
            <li key={i} className="py-3 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-muted-foreground/20 shrink-0" />
              <div className="h-3 bg-muted-foreground/20 rounded" style={{ width: `${w}px` }} />
              <div className="h-3 bg-muted-foreground/10 rounded w-16 ml-auto" />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
