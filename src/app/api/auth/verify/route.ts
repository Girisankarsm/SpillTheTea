import { NextResponse } from "next/server";
import { setSessionCookie, verifyEmailToken } from "@/lib/auth/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const next = url.searchParams.get("next") || "/topics";

  if (!token) {
    return NextResponse.redirect(new URL("/login?auth=failed", url.origin));
  }

  try {
    const user = await verifyEmailToken(token);
    await setSessionCookie(user);
    return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/topics", url.origin));
  } catch {
    return NextResponse.redirect(new URL("/login?auth=failed", url.origin));
  }
}
