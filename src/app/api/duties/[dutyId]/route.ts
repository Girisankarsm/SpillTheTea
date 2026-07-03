import { NextResponse } from "next/server";
import { getDuty, updateDutyStatus } from "@/lib/mongodb/duty-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dutyId: string }> },
) {
  const { dutyId } = await params;
  const duty = await getDuty(dutyId);
  if (!duty) return NextResponse.json({ error: "Duty not found." }, { status: 404 });
  return NextResponse.json({ duty });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ dutyId: string }> },
) {
  try {
    const { dutyId } = await params;
    const body = await request.json();
    await updateDutyStatus(dutyId, body.status, body.extra ?? {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update duty." },
      { status: 400 },
    );
  }
}
