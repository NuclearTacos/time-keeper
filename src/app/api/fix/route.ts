import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
