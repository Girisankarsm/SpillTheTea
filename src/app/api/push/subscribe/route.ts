import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireCurrentUser } from "@/lib/auth/server";
import { mongoCollections } from "@/lib/mongodb/collections";

export const dynamic = "force-dynamic";

type SubscribeBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(request: Request) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Missing subscription fields." }, { status: 400 });
  }

  const pushSubscriptions = await mongoCollections.pushSubscriptions();
  await pushSubscriptions.updateOne(
    { userId: new ObjectId(user.id), endpoint },
    {
      $set: {
        keys: { p256dh, auth },
        updatedAt: new Date(),
      },
      $setOnInsert: {
        userId: new ObjectId(user.id),
        endpoint,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { endpoint?: string };
  try {
    body = (await request.json()) as { endpoint?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }

  const pushSubscriptions = await mongoCollections.pushSubscriptions();
  await pushSubscriptions.deleteOne({ userId: new ObjectId(user.id), endpoint });

  return NextResponse.json({ ok: true });
}
