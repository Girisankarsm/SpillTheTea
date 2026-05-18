/** Comma-separated Supabase auth user ids (app owner / moderators). */
export function getAdminUserIds(): string[] {
  return (process.env.NEXT_PUBLIC_APP_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Comma-separated browser visitor ids for local/demo mode. */
export function getAdminVisitorIds(): string[] {
  return (process.env.NEXT_PUBLIC_APP_ADMIN_VISITOR_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAppAdmin(ctx: {
  visitorId: string | null;
  userId: string | null;
}): boolean {
  if (ctx.userId && getAdminUserIds().includes(ctx.userId)) return true;
  if (ctx.visitorId && getAdminVisitorIds().includes(ctx.visitorId)) return true;
  return false;
}

/** Only the topic creator or app admin (developer) may close a topic. */
export function canDeleteTopic(
  topic: { createdByVisitorId?: string; createdByUserId?: string },
  ctx: { visitorId: string | null; userId: string | null },
): boolean {
  if (isAppAdmin(ctx)) return true;
  if (ctx.userId && topic.createdByUserId && topic.createdByUserId === ctx.userId) {
    return true;
  }
  if (
    ctx.visitorId &&
    topic.createdByVisitorId &&
    topic.createdByVisitorId === ctx.visitorId
  ) {
    return true;
  }
  return false;
}
