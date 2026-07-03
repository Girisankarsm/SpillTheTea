import { NextResponse } from "next/server";
import { topicPreviews } from "@/lib/mongodb/topic-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { topicIds?: unknown[] };
    const topicIds = Array.isArray(body.topicIds)
      ? body.topicIds.map((id: unknown) => String(id))
      : [];
    return NextResponse.json({ previews: await topicPreviews(topicIds) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load previews." },
      { status: 400 },
    );
  }
}
