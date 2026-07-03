import { NextResponse } from "next/server";
import { resendVerification } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await resendVerification(String(body.email ?? ""));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not resend verification email." },
      { status: 400 },
    );
  }
}
