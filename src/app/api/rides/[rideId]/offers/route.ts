import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/server";
import { createRideOffer, pickRideOffer } from "@/lib/mongodb/ride-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ rideId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { rideId } = await params;
    const body = await request.json();
    if (body.action === "pick") {
      await pickRideOffer(rideId, String(body.offerId ?? ""));
      return NextResponse.json({ ok: true });
    }
    const id = await createRideOffer({
      rideId,
      driverName: String(body.driverName ?? user.displayName),
      pitch: String(body.pitch ?? ""),
      vehicleType: String(body.vehicleType ?? "car"),
      vehicleDetail: String(body.vehicleDetail ?? ""),
      rewardAmount: Number(body.rewardAmount ?? 0),
      currency: String(body.currency ?? "INR"),
      userId: user.id,
    });
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update ride offer." },
      { status: 400 },
    );
  }
}
