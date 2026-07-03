import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/server";
import { createDutyOffer, pickDutyOffer } from "@/lib/mongodb/duty-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dutyId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { dutyId } = await params;
    const body = await request.json();
    const action = String(body.action ?? "create");
    if (action === "pick") {
      await pickDutyOffer(dutyId, String(body.offerId ?? ""));
      return NextResponse.json({ ok: true });
    }
    const id = await createDutyOffer({
      dutyId,
      helperName: String(body.helperName ?? user.displayName),
      pitch: String(body.pitch ?? ""),
      rewardAmount: Number(body.rewardAmount ?? 0),
      currency: String(body.currency ?? "INR"),
      userId: user.id,
    });
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update offer." },
      { status: 400 },
    );
  }
}
