import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerUser({
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      legalAccepted: Boolean(body.legalAccepted),
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed." },
      { status: 400 },
    );
  }
}
