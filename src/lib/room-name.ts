export function roomNameKey(topicId: string, identityId: string): string {
  return `${topicId}::${identityId}`;
}

export function resolveAuthorNameForRoom(
  requestedName: string,
  lockedName: string | null | undefined,
): string {
  const trimmed = requestedName.trim() || "anon";
  if (lockedName?.trim()) return lockedName.trim();
  return trimmed;
}
