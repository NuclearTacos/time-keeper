export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b text-sm">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-4">
          <span className="text-muted-foreground text-sm">timer</span>
          <span className="font-semibold text-sm">report</span>
          <span className="text-muted-foreground text-sm">sessions</span>
          <span className="text-muted-foreground text-sm">tags</span>
        </div>
      </nav>
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-5 animate-pulse">
        {/* Tab bar */}
        <div className="flex gap-1">
          <div className="h-7 w-14 bg-foreground/10 rounded-md" />
          <div className="h-7 w-20 bg-muted-foreground/10 rounded-md" />
          <div className="h-7 w-14 bg-muted-foreground/10 rounded-md" />
        </div>
        {/* Total duration */}
        <div className="h-9 w-32 bg-muted-foreground/20 rounded" />
        <div className="h-3 w-48 bg-muted-foreground/10 rounded" />
        {/* Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="h-40 bg-muted-foreground/10 rounded" />
          <div className="h-40 bg-muted-foreground/10 rounded" />
        </div>
      </main>
    </div>
  );
}
