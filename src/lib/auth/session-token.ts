export const AUTH_COOKIE = "stt_session";
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type AuthSessionUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  roles: string[];
  emailVerified: boolean;
};

type SessionPayload = AuthSessionUser & {
  exp: number;
};

function authSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is required for custom authentication.");
  }
  return secret;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeJson(value: unknown): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value))) as T;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

export async function createSessionToken(user: AuthSessionUser): Promise<string> {
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payload = encodeJson({
    ...user,
    exp: Math.floor(Date.now() / 1000) + AUTH_MAX_AGE_SECONDS,
  } satisfies SessionPayload);
  const unsigned = `${header}.${payload}`;
  const signature = await hmac(unsigned);
  return `${unsigned}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<AuthSessionUser | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expected = await hmac(`${header}.${payload}`);
  if (!(await timingSafeEqual(signature, expected))) return null;

  const parsed = decodeJson<SessionPayload>(payload);
  if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;

  return {
    id: parsed.id,
    email: parsed.email,
    displayName: parsed.displayName,
    avatarUrl: parsed.avatarUrl,
    roles: parsed.roles ?? [],
    emailVerified: Boolean(parsed.emailVerified),
  };
}
