import { ObjectId } from "mongodb";
import { mongoClient } from "@/lib/mongodb/client";
import { mongoCollections } from "@/lib/mongodb/collections";
import { ensureMongoIndexes } from "@/lib/mongodb/indexes";
import type { ChatMessage, SendMessageInput, Topic } from "@/lib/types";
import type { TopicPreview } from "@/lib/tea-feed";

const TITLE_MAX = 300;
const BODY_MAX = 4000;
const DATA_URL_MAX_BYTES = 4 * 1024 * 1024;

function validateTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Topic title is required.");
  if (trimmed.length > TITLE_MAX) {
    throw new Error(`Topic title must be ${TITLE_MAX} characters or fewer.`);
  }
  return trimmed;
}

function validateCoordinates(lat: number, lng: number): { lat: number; lng: number } {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Valid location coordinates are required.");
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error("Location coordinates are out of range.");
  }
  return { lat, lng };
}

function validateMessageBody(body: string, mediaUrl?: string): string {
  const trimmed = body.trim();
  if (!trimmed && !mediaUrl) {
    throw new Error("Message body or media is required.");
  }
  if (trimmed.length > BODY_MAX) {
    throw new Error(`Message must be ${BODY_MAX} characters or fewer.`);
  }
  if (mediaUrl?.startsWith("data:") && mediaUrl.length > DATA_URL_MAX_BYTES) {
    throw new Error("Media file is too large. Use a smaller image.");
  }
  return trimmed;
}

function objectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new Error("Invalid id.");
  return new ObjectId(id);
}

function mapTopic(doc: {
  _id?: ObjectId;
  title: string;
  lat: number;
  lng: number;
  createdAt: Date;
  createdByUserId: ObjectId;
}): Topic {
  return {
    id: doc._id?.toString() ?? "",
    title: doc.title,
    lat: doc.lat,
    lng: doc.lng,
    createdAt: doc.createdAt.getTime(),
    createdByUserId: doc.createdByUserId.toString(),
  };
}

function mapMessage(doc: {
  _id?: ObjectId;
  topicId?: ObjectId;
  authorName: string;
  body: string;
  createdAt: Date;
  senderUserId: ObjectId;
  replyToId?: ObjectId;
  mediaUrl?: string;
  mediaType?: "image" | "gif" | "voice" | "file";
}): ChatMessage {
  return {
    id: doc._id?.toString() ?? "",
    topicId: doc.topicId?.toString() ?? "",
    authorName: doc.authorName,
    body: doc.body,
    createdAt: doc.createdAt.getTime(),
    authorUserId: doc.senderUserId.toString(),
    replyToId: doc.replyToId?.toString(),
    mediaUrl: doc.mediaUrl,
    mediaType:
      doc.mediaType === "image" || doc.mediaType === "gif" ? doc.mediaType : undefined,
  };
}

export async function listTopicFeed(): Promise<{
  topics: Topic[];
  topicActivity: Record<string, number>;
  topicJoinCounts: Record<string, number>;
}> {
  const topicsCol = await mongoCollections.topics();
  const messages = await mongoCollections.messages();
  const memberships = await mongoCollections.topicMemberships();
  const docs = await topicsCol.find({}).sort({ lastActivityAt: -1 }).limit(100).toArray();
  const topics = docs.map(mapTopic);
  const topicActivity: Record<string, number> = {};
  const topicJoinCounts: Record<string, number> = {};

  await Promise.all(
    topics.map(async (topic) => {
      const id = objectId(topic.id);
      const [messageCount, joinCount] = await Promise.all([
        messages.countDocuments({ topicId: id }),
        memberships.countDocuments({ topicId: id }),
      ]);
      topicActivity[topic.id] = messageCount;
      topicJoinCounts[topic.id] = joinCount;
    }),
  );

  return { topics, topicActivity, topicJoinCounts };
}

export async function createTopic(input: {
  title: string;
  lat: number;
  lng: number;
  userId: string;
}): Promise<string> {
  await ensureMongoIndexes();
  const title = validateTitle(input.title);
  const { lat, lng } = validateCoordinates(input.lat, input.lng);
  const topics = await mongoCollections.topics();
  const memberships = await mongoCollections.topicMemberships();
  const now = new Date();
  const createdByUserId = objectId(input.userId);
  const result = await topics.insertOne({
    title,
    lat,
    lng,
    location: { type: "Point", coordinates: [lng, lat] },
    createdByUserId,
    createdAt: now,
    lastActivityAt: now,
  });
  await memberships.updateOne(
    { topicId: result.insertedId, userId: createdByUserId },
    { $setOnInsert: { topicId: result.insertedId, userId: createdByUserId, joinedAt: now } },
    { upsert: true },
  );
  return result.insertedId.toString();
}

export type InitialTopicMessageInput = {
  authorName: string;
  body: string;
  mediaUrl?: string;
  mediaType?: "image" | "gif";
};

export async function createTopicWithFirstMessage(input: {
  title: string;
  lat: number;
  lng: number;
  userId: string;
  initialMessage: InitialTopicMessageInput;
}): Promise<{ topicId: string; messageId: string }> {
  await ensureMongoIndexes();
  const title = validateTitle(input.title);
  const { lat, lng } = validateCoordinates(input.lat, input.lng);
  const body = validateMessageBody(input.initialMessage.body, input.initialMessage.mediaUrl);
  const authorName = input.initialMessage.authorName.trim() || "Guest";
  const mediaType =
    input.initialMessage.mediaType === "image" || input.initialMessage.mediaType === "gif"
      ? input.initialMessage.mediaType
      : undefined;

  const client = await mongoClient();
  const session = client.startSession();
  try {
    let topicId = "";
    let messageId = "";
    await session.withTransaction(async () => {
      const topics = await mongoCollections.topics();
      const memberships = await mongoCollections.topicMemberships();
      const messages = await mongoCollections.messages();
      const now = new Date();
      const createdByUserId = objectId(input.userId);

      const topicResult = await topics.insertOne(
        {
          title,
          lat,
          lng,
          location: { type: "Point", coordinates: [lng, lat] },
          createdByUserId,
          createdAt: now,
          lastActivityAt: now,
        },
        { session },
      );
      topicId = topicResult.insertedId.toString();

      await memberships.updateOne(
        { topicId: topicResult.insertedId, userId: createdByUserId },
        {
          $setOnInsert: {
            topicId: topicResult.insertedId,
            userId: createdByUserId,
            joinedAt: now,
          },
        },
        { upsert: true, session },
      );

      const messageResult = await messages.insertOne(
        {
          scope: { kind: "topic", id: topicResult.insertedId },
          topicId: topicResult.insertedId,
          senderUserId: createdByUserId,
          authorName,
          body,
          mediaUrl: input.initialMessage.mediaUrl,
          mediaType,
          createdAt: now,
        },
        { session },
      );
      messageId = messageResult.insertedId.toString();
    });
    if (!topicId || !messageId) {
      throw new Error("Could not create topic and first message.");
    }
    return { topicId, messageId };
  } finally {
    await session.endSession();
  }
}

export async function deleteTopic(topicId: string, userId: string): Promise<void> {
  const topics = await mongoCollections.topics();
  const id = objectId(topicId);
  const userObject = objectId(userId);
  const result = await topics.deleteOne({ _id: id, createdByUserId: userObject });
  if (!result.deletedCount) throw new Error("Only the person who started this room can close it.");
}

export async function listTopicMessages(topicId: string): Promise<ChatMessage[]> {
  const messages = await mongoCollections.messages();
  const docs = await messages
    .find({ topicId: objectId(topicId) })
    .sort({ createdAt: 1 })
    .toArray();
  return docs.map(mapMessage);
}

export async function sendTopicMessage(input: SendMessageInput & {
  userId: string;
}): Promise<string> {
  await ensureMongoIndexes();
  const body = validateMessageBody(input.body, input.mediaUrl);
  const messages = await mongoCollections.messages();
  const topics = await mongoCollections.topics();
  const now = new Date();
  const topicId = objectId(input.topicId);
  const topic = await topics.findOne({ _id: topicId }, { projection: { _id: 1 } });
  if (!topic) throw new Error("Topic not found.");
  const mediaType =
    input.mediaType === "image" || input.mediaType === "gif" ? input.mediaType : undefined;
  const result = await messages.insertOne({
    scope: { kind: "topic", id: topicId },
    topicId,
    senderUserId: objectId(input.userId),
    authorName: input.authorName.trim() || "Guest",
    body,
    replyToId: input.replyToId ? objectId(input.replyToId) : undefined,
    mediaUrl: input.mediaUrl,
    mediaType,
    createdAt: now,
  });
  await topics.updateOne({ _id: topicId }, { $set: { lastActivityAt: now } });
  return result.insertedId.toString();
}

export async function topicPreviews(topicIds: string[]): Promise<Record<string, TopicPreview>> {
  const messages = await mongoCollections.messages();
  const out: Record<string, TopicPreview> = {};
  await Promise.all(
    topicIds.map(async (topicId) => {
      const doc = await messages
        .find({ topicId: objectId(topicId) })
        .sort({ createdAt: 1 })
        .limit(1)
        .next();
      if (!doc) return;
      out[topicId] = {
        authorName: doc.authorName || "anon",
        body: doc.body || "",
        mediaUrl: doc.mediaUrl,
        mediaType:
          doc.mediaType === "image" || doc.mediaType === "gif" ? doc.mediaType : undefined,
      };
    }),
  );
  return out;
}
