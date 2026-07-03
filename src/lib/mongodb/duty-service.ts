import { ObjectId } from "mongodb";
import { mongoCollections } from "@/lib/mongodb/collections";
import type {
  CreateDutyInput,
  CreateDutyOfferInput,
  Duty,
  DutyOffer,
  DutyWithOffers,
} from "@/lib/types/duty";

function oid(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new Error("Invalid id.");
  return new ObjectId(id);
}

function mapDuty(doc: Record<string, any>): Duty {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    authorName: doc.authorName,
    authorUserId: String(doc.authorUserId),
    status: doc.status,
    assignedOfferId: doc.assignedOfferId?.toString(),
    rewardPaidAmount: doc.rewardPaidAmount,
    currency: doc.currency,
    rewardedAt: doc.rewardedAt?.getTime(),
    createdAt: doc.createdAt.getTime(),
  };
}

function mapOffer(doc: Record<string, any>): DutyOffer {
  return {
    id: String(doc._id),
    dutyId: String(doc.dutyId),
    helperName: doc.helperName,
    helperUserId: String(doc.helperUserId),
    pitch: doc.pitch,
    rewardAmount: doc.rewardAmount,
    currency: doc.currency,
    status: doc.status,
    createdAt: doc.createdAt.getTime(),
  };
}

export async function listDuties(): Promise<DutyWithOffers[]> {
  const duties = await mongoCollections.duties();
  const offers = await mongoCollections.dutyOffers();
  const docs = await duties.find({}).sort({ createdAt: -1 }).toArray();
  return Promise.all(
    docs.map(async (duty) => ({
      ...mapDuty(duty),
      offers: (await offers.find({ dutyId: duty._id }).sort({ createdAt: 1 }).toArray()).map(mapOffer),
    })),
  );
}

export async function getDuty(id: string): Promise<DutyWithOffers | null> {
  const duties = await mongoCollections.duties();
  const offers = await mongoCollections.dutyOffers();
  const duty = await duties.findOne({ _id: oid(id) });
  if (!duty) return null;
  return {
    ...mapDuty(duty),
    offers: (await offers.find({ dutyId: duty._id }).sort({ createdAt: 1 }).toArray()).map(mapOffer),
  };
}

export async function createDuty(input: CreateDutyInput & { userId: string }): Promise<string> {
  const duties = await mongoCollections.duties();
  const now = new Date();
  const result = await duties.insertOne({
    title: input.title.trim(),
    description: input.description.trim(),
    authorUserId: oid(input.userId),
    authorName: input.authorName.trim() || "Guest",
    status: "open",
    currency: "INR",
    createdAt: now,
  });
  return result.insertedId.toString();
}

export async function createDutyOffer(input: CreateDutyOfferInput & { userId: string }): Promise<string> {
  const offers = await mongoCollections.dutyOffers();
  const now = new Date();
  const result = await offers.insertOne({
    dutyId: oid(input.dutyId),
    helperUserId: oid(input.userId),
    helperName: input.helperName.trim() || "Guest",
    pitch: input.pitch.trim(),
    rewardAmount: Number(input.rewardAmount),
    currency: input.currency || "INR",
    status: "pending",
    createdAt: now,
  });
  return result.insertedId.toString();
}

export async function updateDutyStatus(id: string, status: Duty["status"], extra: Record<string, unknown> = {}) {
  const duties = await mongoCollections.duties();
  await duties.updateOne({ _id: oid(id) }, { $set: { status, ...extra } });
}

export async function pickDutyOffer(dutyId: string, offerId: string): Promise<void> {
  const duties = await mongoCollections.duties();
  const offers = await mongoCollections.dutyOffers();
  await offers.updateOne({ _id: oid(offerId), dutyId: oid(dutyId) }, { $set: { status: "accepted" } });
  await offers.updateMany({ dutyId: oid(dutyId), _id: { $ne: oid(offerId) } }, { $set: { status: "rejected" } });
  await duties.updateOne({ _id: oid(dutyId) }, { $set: { status: "assigned", assignedOfferId: oid(offerId) } });
}
