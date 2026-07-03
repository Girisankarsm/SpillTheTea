import { NextResponse } from "next/server";
import { currentSessionUser } from "@/lib/auth/server";

export async function GET() {
  const user = await currentSessionUser();
  return NextResponse.json({ user });
}
