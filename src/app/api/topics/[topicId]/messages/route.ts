import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/server";
import { listTopicMessages, sendTopicMessage } from "@/lib/mongodb/topic-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  try {
    const { topicId } = await params;
    return NextResponse.json({ messages: await listTopicMessages(topicId) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load messages." },
      { status: 400 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { topicId } = await params;
    const body = await request.json();
    const id = await sendTopicMessage({
      topicId,
      authorName: String(body.authorName ?? user.displayName),
      body: String(body.body ?? ""),
      replyToId: body.replyToId ? String(body.replyToId) : undefined,
      mediaUrl: body.mediaUrl ? String(body.mediaUrl) : undefined,
      mediaType:
        body.mediaType === "image" || body.mediaType === "gif"
          ? body.mediaType
          : undefined,
      userId: user.id,
    });
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send message." },
      { status: 400 },
    );
  }
}
