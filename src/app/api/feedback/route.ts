import { NextResponse } from "next/server";

const CONVEX_SITE_URL = "https://cheerful-canary-927.convex.site";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "resolve") {
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }
    const res = await fetch(`${CONVEX_SITE_URL}/api/feedback/resolve?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  const res = await fetch(`${CONVEX_SITE_URL}/api/feedback`);
  const data = await res.json();
  return NextResponse.json(data);
}
