import { NextResponse } from "next/server";
import { topicPreviews } from "@/lib/mongodb/topic-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topicIds = Array.isArray(body.topicIds)
      ? body.topicIds.map((id) => String(id))
      : [];
    return NextResponse.json({ previews: await topicPreviews(topicIds) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load previews." },
      { status: 400 },
    );
  }
}
