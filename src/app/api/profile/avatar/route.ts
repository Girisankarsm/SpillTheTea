import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/server";
import { getProfile, upsertProfile } from "@/lib/mongodb/profile-service";

export const dynamic = "force-dynamic";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function isImageUpload(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "avif"].includes(ext ?? "");
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Pick an image file." }, { status: 400 });
    }
    if (!isImageUpload(file)) {
      return NextResponse.json({ error: "Pick an image file (JPG, PNG, GIF, or HEIC)." }, { status: 400 });
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: "Profile photo must be 5 MB or smaller." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const avatarUrl = `data:${file.type || "image/jpeg"};base64,${bytes.toString("base64")}`;
    const existing = await getProfile(user.id);
    await upsertProfile(user.id, {
      displayName: existing?.displayName || user.displayName || "You",
      avatarUrl,
      chakra: existing?.chakra ?? 0,
      paymentUpi: existing?.paymentUpi ?? "",
      paymentPhone: existing?.paymentPhone ?? "",
    });
    return NextResponse.json({ avatarUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not upload profile photo." },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  try {
    const user = await requireCurrentUser();
    const existing = await getProfile(user.id);
    await upsertProfile(user.id, {
      displayName: existing?.displayName || user.displayName || "You",
      avatarUrl: null,
      chakra: existing?.chakra ?? 0,
      paymentUpi: existing?.paymentUpi ?? "",
      paymentPhone: existing?.paymentPhone ?? "",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not remove profile photo." },
      { status: 400 },
    );
  }
}
