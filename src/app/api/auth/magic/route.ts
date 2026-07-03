import { NextResponse } from "next/server";
import { createMagicLink } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await createMagicLink(String(body.email ?? ""));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send sign-in link." },
      { status: 400 },
    );
  }
}
