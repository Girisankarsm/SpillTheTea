import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function isImageUpload(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif" || ext === "webp" || ext === "heic" || ext === "heif" || ext === "avif";
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Profile photo upload is not configured on the server." },
      { status: 503 },
    );
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

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

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await admin.storage.from("profile-avatars").upload(path, bytes, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type.startsWith("image/") ? file.type : "image/jpeg",
  });

  if (uploadErr) {
    return NextResponse.json(
      { error: uploadErr.message || "Could not upload profile photo." },
      { status: 500 },
    );
  }

  const { data: urlData } = admin.storage.from("profile-avatars").getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const { data: existing } = await admin
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const displayName = ((existing?.display_name as string | undefined) ?? "anon").trim() || "anon";

  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: displayName,
      bio: "",
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (profileErr) {
    return NextResponse.json(
      { error: profileErr.message || "Photo uploaded but profile could not be updated." },
      { status: 500 },
    );
  }

  return NextResponse.json({ avatarUrl });
}

export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json({ error: "Profile photo upload is not configured." }, { status: 503 });
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not remove profile photo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
