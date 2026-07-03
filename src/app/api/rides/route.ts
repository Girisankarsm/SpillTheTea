import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/server";
import { createRide, listRides } from "@/lib/mongodb/ride-service";

export async function GET() {
  return NextResponse.json({ rides: await listRides() });
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const id = await createRide({
      riderName: String(body.riderName ?? user.displayName),
      pickupLabel: String(body.pickupLabel ?? ""),
      pickupLat: body.pickupLat == null ? undefined : Number(body.pickupLat),
      pickupLng: body.pickupLng == null ? undefined : Number(body.pickupLng),
      dropLabel: String(body.dropLabel ?? ""),
      dropLat: body.dropLat == null ? undefined : Number(body.dropLat),
      dropLng: body.dropLng == null ? undefined : Number(body.dropLng),
      notes: String(body.notes ?? ""),
      vehiclePreference: String(body.vehiclePreference ?? ""),
      vehicleDetail: String(body.vehicleDetail ?? ""),
      maxReward: body.maxReward == null ? undefined : Number(body.maxReward),
      currency: String(body.currency ?? "INR"),
      userId: user.id,
    });
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create ride." },
      { status: 400 },
    );
  }
}
