/** Append a message if its id is not already in the list. */
export function appendUniqueMessage<T extends { id: string }>(
  prev: T[],
  next: T,
): T[] {
  if (prev.some((entry) => entry.id === next.id)) return prev;
  return [...prev, next];
}
