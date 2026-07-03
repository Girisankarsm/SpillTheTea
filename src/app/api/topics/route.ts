import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/server";
import { createTopic, listTopicFeed } from "@/lib/mongodb/topic-service";

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
    const id = await createTopic({
      title: String(body.title ?? ""),
      lat: Number(body.lat),
      lng: Number(body.lng),
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
