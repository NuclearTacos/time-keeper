"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export function NavBar() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();

  return (
    <nav className="border-b px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className={pathname === "/" ? "font-semibold" : "text-muted-foreground hover:text-foreground transition-colors"}
        >
          timer
        </Link>
        <Link
          href="/review"
          className={pathname === "/review" ? "font-semibold" : "text-muted-foreground hover:text-foreground transition-colors"}
        >
          review
        </Link>
      </div>
      <button
        onClick={() => signOut()}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        sign out
      </button>
    </nav>
  );
}
