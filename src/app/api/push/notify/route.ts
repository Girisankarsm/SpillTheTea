import { NextResponse } from "next/server";
import type { PushMessageKind } from "@/lib/push/client";
import { sendPushForMessage } from "@/lib/push/server";
import { requireCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type NotifyBody = {
  kind?: PushMessageKind;
  messageId?: string;
};

export async function POST(request: Request) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: NotifyBody;
  try {
    body = (await request.json()) as NotifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const kind = body.kind;
  const messageId = body.messageId?.trim();

  if (!kind || !messageId) {
    return NextResponse.json({ error: "Missing kind or messageId." }, { status: 400 });
  }

  if (!["duty_chat", "ride_chat", "dm"].includes(kind)) {
    return NextResponse.json({ error: "Invalid kind." }, { status: 400 });
  }

  try {
    await sendPushForMessage(kind, messageId, user.id);
  } catch {
    /* push is best-effort */
  }

  return NextResponse.json({ ok: true });
}
