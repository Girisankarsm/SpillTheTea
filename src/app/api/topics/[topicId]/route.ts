import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/server";
import { deleteTopic } from "@/lib/mongodb/topic-service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { topicId } = await params;
    await deleteTopic(topicId, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete topic." },
      { status: 403 },
    );
  }
}
