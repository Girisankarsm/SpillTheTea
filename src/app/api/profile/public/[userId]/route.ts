import { NextResponse } from "next/server";
import { publicProfile } from "@/lib/mongodb/profile-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  try {
    return NextResponse.json({ profile: await publicProfile(userId) });
  } catch {
    return NextResponse.json({ profile: { displayName: "Someone", chakra: 0 } });
  }
}
