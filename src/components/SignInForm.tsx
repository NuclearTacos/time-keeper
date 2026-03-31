"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn("password", { email, password, flow });
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGitHub() {
    setLoading(true);
    try {
      await signIn("github");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Time Keeper</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {flow === "signIn" ? "Sign in to your account" : "Create an account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="w-full border rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="w-full border rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full border rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
        >
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <button
        onClick={handleGitHub}
        disabled={loading}
        className="w-full border rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
      >
        Continue with GitHub
      </button>

      <p className="text-center text-xs text-muted-foreground">
        {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          className="underline"
        >
          {flow === "signIn" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
