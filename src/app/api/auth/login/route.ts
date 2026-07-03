import { NextResponse } from "next/server";
import { loginUser, setSessionCookie } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await loginUser({
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
    });
    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Login failed." },
      { status: 401 },
    );
  }
}
