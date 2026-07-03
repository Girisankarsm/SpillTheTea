import { ObjectId } from "mongodb";
import { mongoCollections } from "@/lib/mongodb/collections";
import type { ChatMessage, SendMessageInput, Topic } from "@/lib/types";
import type { TopicPreview } from "@/lib/tea-feed";

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
  const topics = await mongoCollections.topics();
  const memberships = await mongoCollections.topicMemberships();
  const now = new Date();
  const createdByUserId = objectId(input.userId);
  const result = await topics.insertOne({
    title: input.title.trim(),
    lat: input.lat,
    lng: input.lng,
    location: { type: "Point", coordinates: [input.lng, input.lat] },
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
  const messages = await mongoCollections.messages();
  const topics = await mongoCollections.topics();
  const now = new Date();
  const topicId = objectId(input.topicId);
  const result = await messages.insertOne({
    scope: { kind: "topic", id: topicId },
    topicId,
    senderUserId: objectId(input.userId),
    authorName: input.authorName.trim() || "Guest",
    body: input.body.trim(),
    replyToId: input.replyToId ? objectId(input.replyToId) : undefined,
    mediaUrl: input.mediaUrl,
    mediaType: input.mediaType,
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
