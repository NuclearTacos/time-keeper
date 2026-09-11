import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

export async function POST(request: Request) {
  // Triggering a fix run hands arbitrary text to Claude, which ships code to
  // main. Restrict it to admins (users.isAdmin in Convex) — being signed in is
  // not enough, since signup is self-serve.
  const token = await convexAuthNextjsToken();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const isAdmin = await fetchQuery(api.admin.isCurrentUserAdmin, {}, { token });
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Admin permission required" },
      { status: 403 },
    );
  }

  const { feedbackText } = await request.json();

  const webhookUrl = process.env.CLAUDE_FIX_WEBHOOK_URL;
  const webhookSecret = process.env.CLAUDE_FIX_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${webhookSecret}`,
      "anthropic-beta": "experimental-cc-routine-2026-04-01",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: feedbackText }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
