import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {
    mongodbUri: process.env.MONGODB_URI?.trim() ? "set" : "missing",
    authSecret: process.env.AUTH_SECRET?.trim() ? "set" : "missing",
    resendKey: process.env.RESEND_API_KEY?.trim() ? "set" : "missing",
    appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() ? "set" : "missing",
  };

  if (!process.env.MONGODB_URI?.trim()) {
    return NextResponse.json(
      { ok: false, checks, error: "MONGODB_URI is not configured." },
      { status: 503 },
    );
  }

  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return NextResponse.json({ ok: true, checks });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        checks,
        error: err instanceof Error ? err.message : "MongoDB ping failed.",
      },
      { status: 503 },
    );
  }
}
