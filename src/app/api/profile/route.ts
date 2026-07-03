import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/server";
import { getProfile, upsertProfile } from "@/lib/mongodb/profile-service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return NextResponse.json({ profile: await getProfile(user.id) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not signed in." },
      { status: 401 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const profile = await upsertProfile(user.id, {
      displayName: String(body.displayName ?? ""),
      avatarUrl: body.avatarUrl == null ? null : String(body.avatarUrl),
      chakra: Number(body.chakra ?? 0),
      paymentUpi: String(body.paymentUpi ?? ""),
      paymentPhone: String(body.paymentPhone ?? ""),
    });
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save profile." },
      { status: 400 },
    );
  }
}
