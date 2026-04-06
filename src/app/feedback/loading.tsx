export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b text-sm">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-4">
          <span className="text-muted-foreground text-sm">timer</span>
          <span className="text-muted-foreground text-sm">report</span>
          <span className="text-muted-foreground text-sm">sessions</span>
          <span className="text-muted-foreground text-sm">tags</span>
        </div>
      </nav>
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-4 w-20 bg-muted-foreground/20 rounded" />
        <ul className="space-y-3">
          {[3, 2, 4].map((lines, i) => (
            <li key={i} className="border rounded p-3 space-y-2">
              <div className="h-2.5 w-32 bg-muted-foreground/10 rounded" />
              {Array.from({ length: lines }).map((_, j) => (
                <div
                  key={j}
                  className="h-3 bg-muted-foreground/10 rounded"
                  style={{ width: j === lines - 1 ? "60%" : "100%" }}
                />
              ))}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
