import { createHash, randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { LEGAL_ACCEPTANCE_VERSION } from "@/lib/legal-acceptance";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  AUTH_COOKIE,
  AUTH_MAX_AGE_SECONDS,
  createSessionToken,
  type AuthSessionUser,
  verifySessionToken,
} from "@/lib/auth/session-token";
import { sendMagicLinkEmail, sendVerificationEmail } from "@/lib/auth/email";
import { mongoCollections } from "@/lib/mongodb/collections";
import { ensureMongoIndexes } from "@/lib/mongodb/indexes";
import type { MongoUser } from "@/lib/mongodb/models";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

function publicUser(user: MongoUser & { _id: ObjectId }): AuthSessionUser {
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    roles: user.roles ?? [],
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

function defaultDisplayName(email: string): string {
  return email.split("@")[0]?.replace(/[^a-zA-Z0-9_ -]/g, "").slice(0, 24) || "You";
}

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function setSessionCookie(user: AuthSessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function currentSessionUser(): Promise<AuthSessionUser | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(AUTH_COOKIE)?.value);
}

export async function requireCurrentUser(): Promise<AuthSessionUser> {
  const user = await currentSessionUser();
  if (!user) throw new Error("Not signed in.");
  return user;
}

export async function registerUser(input: {
  email: string;
  password: string;
  legalAccepted: boolean;
}): Promise<{ pendingVerification: boolean }> {
  if (!input.legalAccepted) throw new Error("Accept Terms and Privacy first.");
  if (input.password.length < 6) throw new Error("Password must be at least 6 characters.");

  await ensureMongoIndexes();

  const email = normalizeEmail(input.email);
  const users = await mongoCollections.users();
  const existing = await users.findOne({ email });
  const verificationToken = newToken();
  const verificationTokenHash = tokenHash(verificationToken);
  const verificationExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  const now = new Date();

  if (existing) {
    if (!existing.emailVerifiedAt) {
      await users.updateOne(
        { _id: existing._id },
        {
          $set: {
            verificationTokenHash,
            verificationExpiresAt,
            updatedAt: now,
          },
        },
      );
      await sendVerificationEmail(email, verificationToken);
    }
    return { pendingVerification: true };
  }

  await users.insertOne({
    email,
    passwordHash: hashPassword(input.password),
    displayName: defaultDisplayName(email),
    roles: [],
    emailVerifiedAt: null,
    verificationTokenHash,
    verificationExpiresAt,
    legalAcceptedVersion: LEGAL_ACCEPTANCE_VERSION,
    legalAcceptedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await sendVerificationEmail(email, verificationToken);
  return { pendingVerification: true };
}

export async function verifyEmailToken(token: string): Promise<AuthSessionUser> {
  await ensureMongoIndexes();
  const users = await mongoCollections.users();
  const now = new Date();
  const user = await users.findOne({
    verificationTokenHash: tokenHash(token),
    verificationExpiresAt: { $gt: now },
  });
  if (!user?._id) throw new Error("Verification link is invalid or expired.");

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerifiedAt: user.emailVerifiedAt ?? now,
        updatedAt: now,
      },
      $unset: {
        verificationTokenHash: "",
        verificationExpiresAt: "",
      },
    },
  );

  const next = {
    ...user,
    emailVerifiedAt: user.emailVerifiedAt ?? now,
  } as MongoUser & { _id: ObjectId };

  return publicUser(next);
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthSessionUser> {
  const email = normalizeEmail(input.email);
  const users = await mongoCollections.users();
  const user = await users.findOne({ email });
  if (!user?._id || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }
  if (!user.emailVerifiedAt) {
    throw new Error("Verify your email first. Check your inbox and spam folder.");
  }
  return publicUser(user as MongoUser & { _id: ObjectId });
}

export async function resendVerification(emailRaw: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  const users = await mongoCollections.users();
  const user = await users.findOne({ email });
  if (!user || user.emailVerifiedAt) return;
  const verificationToken = newToken();
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        verificationTokenHash: tokenHash(verificationToken),
        verificationExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        updatedAt: new Date(),
      },
    },
  );
  await sendVerificationEmail(email, verificationToken);
}

export async function createMagicLink(emailRaw: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  const users = await mongoCollections.users();
  const user = await users.findOne({ email });
  if (!user || !user.emailVerifiedAt) return;
  const token = newToken();
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        verificationTokenHash: tokenHash(token),
        verificationExpiresAt: new Date(Date.now() + 1000 * 60 * 15),
        updatedAt: new Date(),
      },
    },
  );
  await sendMagicLinkEmail(email, token);
}
