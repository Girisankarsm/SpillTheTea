/** Supabase/RPC errors are often `{ message }` objects, not `Error` instances. */
export function unknownErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  ) {
    return (e as { message: string }).message;
  }
  if (typeof e === "string") return e;
  return fallback;
}
