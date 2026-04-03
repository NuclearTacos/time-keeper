"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { FeedbackButton } from "./FeedbackButton";

export function NavBar() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();

  return (
    <nav className="border-b text-sm">
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={pathname === "/" ? "font-semibold" : "text-muted-foreground hover:text-foreground transition-colors"}
          >
            timer
          </Link>
          <Link
            href="/report"
            className={pathname === "/report" ? "font-semibold" : "text-muted-foreground hover:text-foreground transition-colors"}
          >
            report
          </Link>
          <Link
            href="/sessions"
            className={pathname === "/sessions" ? "font-semibold" : "text-muted-foreground hover:text-foreground transition-colors"}
          >
            sessions
          </Link>
          <Link
            href="/tags"
            className={pathname === "/tags" ? "font-semibold" : "text-muted-foreground hover:text-foreground transition-colors"}
          >
            tags
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <FeedbackButton />
          <button
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
