import type { ObjectId } from "mongodb";

export type MongoUser = {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string | null;
  roles: string[];
  emailVerifiedAt?: Date | null;
  verificationTokenHash?: string | null;
  verificationExpiresAt?: Date | null;
  legalAcceptedVersion?: string | null;
  legalAcceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MongoProfile = {
  _id?: ObjectId;
  userId: ObjectId;
  displayName: string;
  avatarUrl?: string | null;
  chakra: number;
  paymentUpi?: string;
  paymentPhone?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MongoTopic = {
  _id?: ObjectId;
  title: string;
  lat: number;
  lng: number;
  location: { type: "Point"; coordinates: [number, number] };
  createdByUserId: ObjectId;
  createdAt: Date;
  lastActivityAt: Date;
};

export type MongoMessageScope = {
  kind: "topic" | "duty" | "ride" | "dm";
  id: ObjectId;
};

export type MongoMessage = {
  _id?: ObjectId;
  scope: MongoMessageScope;
  topicId?: ObjectId;
  dutyId?: ObjectId;
  rideId?: ObjectId;
  threadId?: ObjectId;
  senderUserId: ObjectId;
  authorName: string;
  body: string;
  replyToId?: ObjectId;
  mediaUrl?: string;
  mediaType?: "image" | "gif" | "voice" | "file";
  createdAt: Date;
};

export type MongoDuty = {
  _id?: ObjectId;
  title: string;
  description: string;
  authorUserId: ObjectId;
  authorName: string;
  status: "open" | "assigned" | "completed" | "rewarded";
  assignedOfferId?: ObjectId;
  rewardPaidAmount?: number;
  currency: string;
  rewardedAt?: Date;
  createdAt: Date;
};

export type MongoRide = {
  _id?: ObjectId;
  riderUserId: ObjectId;
  riderName: string;
  pickupLabel: string;
  pickupLocation?: { type: "Point"; coordinates: [number, number] };
  dropLabel: string;
  dropLocation?: { type: "Point"; coordinates: [number, number] };
  notes: string;
  vehiclePreference: string;
  vehicleDetail: string;
  maxReward?: number;
  currency: string;
  status: "open" | "matched" | "completed" | "rewarded";
  matchedOfferId?: ObjectId;
  rewardPaidAmount?: number;
  rewardedAt?: Date;
  createdAt: Date;
};
