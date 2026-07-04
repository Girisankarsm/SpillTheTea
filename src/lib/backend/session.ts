export function isAuthenticatedUser(
  user: { is_anonymous?: boolean } | null | undefined,
): boolean {
  return Boolean(user && !user.is_anonymous);
}
