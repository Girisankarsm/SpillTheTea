import { ObjectId } from "mongodb";
import { mongoCollections } from "@/lib/mongodb/collections";
import type { UserProfile } from "@/lib/types/profile";

function userObjectId(userId: string): ObjectId {
  if (!ObjectId.isValid(userId)) throw new Error("Invalid user id.");
  return new ObjectId(userId);
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const profiles = await mongoCollections.profiles();
  const profile = await profiles.findOne({ userId: userObjectId(userId) });
  if (!profile) return null;
  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    chakra: profile.chakra ?? 0,
    paymentUpi: profile.paymentUpi ?? "",
    paymentPhone: profile.paymentPhone ?? "",
    updatedAt: profile.updatedAt.getTime(),
  };
}

export async function upsertProfile(
  userId: string,
  input: UserProfile,
): Promise<UserProfile> {
  const profiles = await mongoCollections.profiles();
  const users = await mongoCollections.users();
  const now = new Date();
  const userObject = userObjectId(userId);
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error("Pick a display name.");

  await profiles.updateOne(
    { userId: userObject },
    {
      $set: {
        displayName,
        avatarUrl: input.avatarUrl ?? null,
        chakra: input.chakra ?? 0,
        paymentUpi: input.paymentUpi ?? "",
        paymentPhone: input.paymentPhone ?? "",
        updatedAt: now,
      },
      $setOnInsert: {
        userId: userObject,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  await users.updateOne(
    { _id: userObject },
    {
      $set: {
        displayName,
        avatarUrl: input.avatarUrl ?? null,
        updatedAt: now,
      },
    },
  );

  return {
    displayName,
    avatarUrl: input.avatarUrl ?? null,
    chakra: input.chakra ?? 0,
    paymentUpi: input.paymentUpi ?? "",
    paymentPhone: input.paymentPhone ?? "",
    updatedAt: now.getTime(),
  };
}

export async function publicProfile(userId: string) {
  const profile = await getProfile(userId);
  return {
    displayName: profile?.displayName || "You",
    chakra: profile?.chakra ?? 0,
  };
}
