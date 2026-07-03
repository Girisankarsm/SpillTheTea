import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/server";
import { createDuty, listDuties } from "@/lib/mongodb/duty-service";

export async function GET() {
  return NextResponse.json({ duties: await listDuties() });
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const id = await createDuty({
      title: String(body.title ?? ""),
      description: String(body.description ?? ""),
      authorName: String(body.authorName ?? user.displayName),
      userId: user.id,
    });
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create duty." },
      { status: 400 },
    );
  }
}
