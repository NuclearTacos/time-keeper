"use client";

import { useState } from "react";

interface Props {
  label: string;
  onBump: (deltaMinutes: number) => void;
}

export function TimeBumpInput({ label, onBump }: Props) {
  const [value, setValue] = useState("5");

  function bump(sign: 1 | -1) {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n > 0) onBump(sign * n);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") bump(1);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}:</span>
      <input
        type="number"
        min="1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-14 text-xs text-center bg-transparent border rounded px-1.5 py-0.5 focus:outline-none focus:border-foreground/50 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-xs text-muted-foreground">min</span>
      <button
        onClick={() => bump(-1)}
        className="text-xs border rounded px-2 py-0.5 hover:bg-muted transition-colors"
      >
        −
      </button>
      <button
        onClick={() => bump(1)}
        className="text-xs border rounded px-2 py-0.5 hover:bg-muted transition-colors"
      >
        +
      </button>
    </div>
  );
}
