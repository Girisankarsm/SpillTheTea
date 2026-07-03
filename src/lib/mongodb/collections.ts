import type { Collection, Document } from "mongodb";
import { mongoDb } from "@/lib/mongodb/client";
import type {
  MongoDuty,
  MongoMessage,
  MongoProfile,
  MongoRide,
  MongoTopic,
  MongoUser,
} from "@/lib/mongodb/models";

export async function collection<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await mongoDb();
  return db.collection<T>(name);
}

export const mongoCollections = {
  users: () => collection<MongoUser>("users"),
  profiles: () => collection<MongoProfile>("profiles"),
  topics: () => collection<MongoTopic>("topics"),
  topicMemberships: () => collection("topicMemberships"),
  messages: () => collection<MongoMessage>("messages"),
  messageUpvotes: () => collection("messageUpvotes"),
  polls: () => collection("polls"),
  pollVotes: () => collection("pollVotes"),
  dmRequests: () => collection("dmRequests"),
  dmThreads: () => collection("dmThreads"),
  duties: () => collection<MongoDuty>("duties"),
  dutyOffers: () => collection("dutyOffers"),
  rides: () => collection<MongoRide>("rides"),
  rideOffers: () => collection("rideOffers"),
  rideLiveLocations: () => collection("rideLiveLocations"),
  pushSubscriptions: () => collection("pushSubscriptions"),
  payments: () => collection("payments"),
};
