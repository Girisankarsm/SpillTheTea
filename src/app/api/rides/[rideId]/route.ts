import { NextResponse } from "next/server";
import { getRide, updateRideStatus } from "@/lib/mongodb/ride-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ rideId: string }> },
) {
  const { rideId } = await params;
  const ride = await getRide(rideId);
  if (!ride) return NextResponse.json({ error: "Ride not found." }, { status: 404 });
  return NextResponse.json({ ride });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ rideId: string }> },
) {
  try {
    const { rideId } = await params;
    const body = await request.json();
    await updateRideStatus(rideId, body.status, body.extra ?? {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update ride." },
      { status: 400 },
    );
  }
}
