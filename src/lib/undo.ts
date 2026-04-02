let lastUndo: (() => Promise<void>) | null = null;

export function setLastUndo(fn: () => Promise<void>) {
  lastUndo = fn;
}

export function popLastUndo(): (() => Promise<void>) | null {
  const fn = lastUndo;
  lastUndo = null;
  return fn;
}
