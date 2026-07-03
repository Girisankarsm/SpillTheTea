import { ObjectId } from "mongodb";
import { mongoCollections } from "@/lib/mongodb/collections";
import type {
  CreateRideInput,
  CreateRideOfferInput,
  RideOffer,
  RideRequest,
  RideWithOffers,
} from "@/lib/types/ride";

function oid(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new Error("Invalid id.");
  return new ObjectId(id);
}

function point(lat?: number, lng?: number) {
  return lat != null && lng != null ? { type: "Point" as const, coordinates: [lng, lat] as [number, number] } : undefined;
}

function mapRide(doc: Record<string, any>): RideRequest {
  return {
    id: String(doc._id),
    riderName: doc.riderName,
    riderUserId: String(doc.riderUserId),
    pickupLabel: doc.pickupLabel,
    pickupLat: doc.pickupLocation?.coordinates?.[1],
    pickupLng: doc.pickupLocation?.coordinates?.[0],
    dropLabel: doc.dropLabel,
    dropLat: doc.dropLocation?.coordinates?.[1],
    dropLng: doc.dropLocation?.coordinates?.[0],
    notes: doc.notes,
    vehiclePreference: doc.vehiclePreference,
    vehicleDetail: doc.vehicleDetail,
    maxReward: doc.maxReward,
    currency: doc.currency,
    status: doc.status,
    matchedOfferId: doc.matchedOfferId?.toString(),
    rewardPaidAmount: doc.rewardPaidAmount,
    rewardedAt: doc.rewardedAt?.getTime(),
    createdAt: doc.createdAt.getTime(),
  };
}

function mapOffer(doc: Record<string, any>): RideOffer {
  return {
    id: String(doc._id),
    rideId: String(doc.rideId),
    driverName: doc.driverName,
    driverUserId: String(doc.driverUserId),
    pitch: doc.pitch,
    vehicleType: doc.vehicleType,
    vehicleDetail: doc.vehicleDetail,
    rewardAmount: doc.rewardAmount,
    currency: doc.currency,
    status: doc.status,
    createdAt: doc.createdAt.getTime(),
  };
}

export async function listRides(): Promise<RideWithOffers[]> {
  const rides = await mongoCollections.rides();
  const offers = await mongoCollections.rideOffers();
  const docs = await rides.find({}).sort({ createdAt: -1 }).toArray();
  return Promise.all(
    docs.map(async (ride) => ({
      ...mapRide(ride),
      offers: (await offers.find({ rideId: ride._id }).sort({ createdAt: 1 }).toArray()).map(mapOffer),
    })),
  );
}

export async function getRide(id: string): Promise<RideWithOffers | null> {
  const rides = await mongoCollections.rides();
  const offers = await mongoCollections.rideOffers();
  const ride = await rides.findOne({ _id: oid(id) });
  if (!ride) return null;
  return {
    ...mapRide(ride),
    offers: (await offers.find({ rideId: ride._id }).sort({ createdAt: 1 }).toArray()).map(mapOffer),
  };
}

export async function createRide(input: CreateRideInput & { userId: string }): Promise<string> {
  const rides = await mongoCollections.rides();
  const now = new Date();
  const result = await rides.insertOne({
    riderUserId: oid(input.userId),
    riderName: input.riderName.trim() || "Rider",
    pickupLabel: input.pickupLabel.trim(),
    pickupLocation: point(input.pickupLat, input.pickupLng),
    dropLabel: input.dropLabel.trim(),
    dropLocation: point(input.dropLat, input.dropLng),
    notes: input.notes ?? "",
    vehiclePreference: input.vehiclePreference ?? "",
    vehicleDetail: input.vehicleDetail ?? "",
    maxReward: input.maxReward,
    currency: input.currency || "INR",
    status: "open",
    createdAt: now,
  });
  return result.insertedId.toString();
}

export async function createRideOffer(input: CreateRideOfferInput & { userId: string }): Promise<string> {
  const offers = await mongoCollections.rideOffers();
  const now = new Date();
  const result = await offers.insertOne({
    rideId: oid(input.rideId),
    driverUserId: oid(input.userId),
    driverName: input.driverName.trim() || "Driver",
    pitch: input.pitch.trim(),
    vehicleType: input.vehicleType || "car",
    vehicleDetail: input.vehicleDetail || "",
    rewardAmount: Number(input.rewardAmount),
    currency: input.currency || "INR",
    status: "pending",
    createdAt: now,
  });
  return result.insertedId.toString();
}

export async function pickRideOffer(rideId: string, offerId: string): Promise<void> {
  const rides = await mongoCollections.rides();
  const offers = await mongoCollections.rideOffers();
  await offers.updateOne({ _id: oid(offerId), rideId: oid(rideId) }, { $set: { status: "accepted" } });
  await offers.updateMany({ rideId: oid(rideId), _id: { $ne: oid(offerId) } }, { $set: { status: "rejected" } });
  await rides.updateOne({ _id: oid(rideId) }, { $set: { status: "matched", matchedOfferId: oid(offerId) } });
}

export async function updateRideStatus(id: string, status: RideRequest["status"], extra: Record<string, unknown> = {}) {
  const rides = await mongoCollections.rides();
  await rides.updateOne({ _id: oid(id) }, { $set: { status, ...extra } });
}
