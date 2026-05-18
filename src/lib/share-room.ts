export function roomShareUrl(topicId: string): string {
  if (typeof window === "undefined") return `/topics/${topicId}`;
  return `${window.location.origin}/topics/${topicId}`;
}

export function roomShareText(title: string): string {
  return `Join "${title}" on SpillTheTea — anonymous convo room.`;
}
