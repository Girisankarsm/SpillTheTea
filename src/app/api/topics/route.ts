import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/server";
import {
  createTopic,
  createTopicWithFirstMessage,
  listTopicFeed,
} from "@/lib/mongodb/topic-service";

export async function GET() {
  try {
    return NextResponse.json(await listTopicFeed());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load topics." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const title = String(body.title ?? "");
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const initialMessage = body.initialMessage;

    if (initialMessage && typeof initialMessage === "object") {
      const result = await createTopicWithFirstMessage({
        title,
        lat,
        lng,
        userId: user.id,
        initialMessage: {
          authorName: String(initialMessage.authorName ?? user.displayName),
          body: String(initialMessage.body ?? ""),
          mediaUrl: initialMessage.mediaUrl ? String(initialMessage.mediaUrl) : undefined,
          mediaType:
            initialMessage.mediaType === "image" || initialMessage.mediaType === "gif"
              ? initialMessage.mediaType
              : undefined,
        },
      });
      return NextResponse.json({ id: result.topicId, messageId: result.messageId });
    }

    const id = await createTopic({
      title,
      lat,
      lng,
      userId: user.id,
    });
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create topic." },
      { status: 400 },
    );
  }
}
