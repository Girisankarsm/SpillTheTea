import type { SupabaseClient } from "@supabase/supabase-js";
import { chakraPointsForDuty } from "@/lib/chakra";
import { awardChakraRemote } from "@/lib/supabase/profile-remote";
import type {
  CreateRideInput,
  CreateRideOfferInput,
  RideOffer,
  RideRequest,
  RideStatus,
  RideWithOffers,
} from "@/lib/types/ride";

type RideRow = {
  id: string;
  rider_name: string;
  user_id: string;
  pickup_label: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  drop_label: string;
  drop_lat: number | null;
  drop_lng: number | null;
  notes: string;
  max_reward: number | null;
  currency: string;
  status: RideStatus;
  matched_offer_id: string | null;
  reward_paid_amount: number | null;
  rewarded_at: string | null;
  created_at: string;
};

type OfferRow = {
  id: string;
  ride_id: string;
  driver_name: string;
  user_id: string;
  pitch: string;
  reward_amount: number;
  currency: string;
  status: RideOffer["status"];
  created_at: string;
};

const RIDE_SELECT =
  "id, rider_name, user_id, pickup_label, pickup_lat, pickup_lng, drop_label, drop_lat, drop_lng, notes, max_reward, currency, status, matched_offer_id, reward_paid_amount, rewarded_at, created_at";

const OFFER_SELECT =
  "id, ride_id, driver_name, user_id, pitch, reward_amount, currency, status, created_at";

function mapRide(row: RideRow): RideRequest {
  return {
    id: row.id,
    riderName: row.rider_name || "Guest",
    riderUserId: row.user_id,
    pickupLabel: row.pickup_label,
    pickupLat: row.pickup_lat ?? undefined,
    pickupLng: row.pickup_lng ?? undefined,
    dropLabel: row.drop_label,
    dropLat: row.drop_lat ?? undefined,
    dropLng: row.drop_lng ?? undefined,
    notes: row.notes || "",
    maxReward: row.max_reward != null ? Number(row.max_reward) : undefined,
    currency: row.currency || "INR",
    status: row.status,
    matchedOfferId: row.matched_offer_id ?? undefined,
    rewardPaidAmount:
      row.reward_paid_amount != null ? Number(row.reward_paid_amount) : undefined,
    rewardedAt: row.rewarded_at ? new Date(row.rewarded_at).getTime() : undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function mapOffer(row: OfferRow): RideOffer {
  return {
    id: row.id,
    rideId: row.ride_id,
    driverName: row.driver_name || "Guest",
    driverUserId: row.user_id,
    pitch: row.pitch || "",
    rewardAmount: Number(row.reward_amount),
    currency: row.currency || "INR",
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function attachOffers(rides: RideRequest[], offers: RideOffer[]): RideWithOffers[] {
  const byRide = new Map<string, RideOffer[]>();
  for (const offer of offers) {
    const list = byRide.get(offer.rideId) ?? [];
    list.push(offer);
    byRide.set(offer.rideId, list);
  }
  return rides.map((ride) => ({
    ...ride,
    offers: (byRide.get(ride.id) ?? []).sort((a, b) => a.createdAt - b.createdAt),
  }));
}

export async function fetchRides(client: SupabaseClient): Promise<RideWithOffers[]> {
  const { data: rideRows, error: rideErr } = await client
    .from("ride_requests")
    .select(RIDE_SELECT)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (rideErr) throw rideErr;
  if (!rideRows?.length) return [];

  const rideIds = rideRows.map((row) => row.id as string);
  const { data: offerRows, error: offerErr } = await client
    .from("ride_offers")
    .select(OFFER_SELECT)
    .in("ride_id", rideIds)
    .order("created_at", { ascending: true });

  if (offerErr) throw offerErr;

  return attachOffers(
    (rideRows as RideRow[]).map(mapRide),
    ((offerRows ?? []) as OfferRow[]).map(mapOffer),
  );
}

export async function fetchRideById(
  client: SupabaseClient,
  rideId: string,
): Promise<RideWithOffers | null> {
  const { data: rideRow, error: rideErr } = await client
    .from("ride_requests")
    .select(RIDE_SELECT)
    .eq("id", rideId)
    .maybeSingle();

  if (rideErr) throw rideErr;
  if (!rideRow) return null;

  const { data: offerRows, error: offerErr } = await client
    .from("ride_offers")
    .select(OFFER_SELECT)
    .eq("ride_id", rideId)
    .order("created_at", { ascending: true });

  if (offerErr) throw offerErr;

  return {
    ...mapRide(rideRow as RideRow),
    offers: ((offerRows ?? []) as OfferRow[]).map(mapOffer),
  };
}

export async function createRideRemote(
  client: SupabaseClient,
  input: CreateRideInput,
): Promise<RideRequest> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to request a ride.");

  const pickupLabel = input.pickupLabel.trim();
  const dropLabel = input.dropLabel.trim();
  if (!pickupLabel || !dropLabel) throw new Error("Add pickup and drop locations.");

  const { data, error } = await client
    .from("ride_requests")
    .insert({
      rider_name: input.riderName.trim() || "Guest",
      user_id: user.id,
      pickup_label: pickupLabel,
      pickup_lat: input.pickupLat ?? null,
      pickup_lng: input.pickupLng ?? null,
      drop_label: dropLabel,
      drop_lat: input.dropLat ?? null,
      drop_lng: input.dropLng ?? null,
      notes: input.notes?.trim() ?? "",
      max_reward:
        input.maxReward != null && Number.isFinite(input.maxReward)
          ? input.maxReward
          : null,
      currency: input.currency ?? "INR",
    })
    .select(RIDE_SELECT)
    .single();

  if (error || !data) throw error ?? new Error("Could not post ride request.");
  return mapRide(data as RideRow);
}

export async function createRideOfferRemote(
  client: SupabaseClient,
  input: CreateRideOfferInput,
): Promise<RideOffer> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to offer a ride.");

  const ride = await fetchRideById(client, input.rideId);
  if (!ride) throw new Error("Ride request not found.");
  if (ride.status !== "open") throw new Error("This ride is no longer open.");
  if (ride.riderUserId === user.id) throw new Error("You cannot offer on your own request.");

  const existing = ride.offers.find((offer) => offer.driverUserId === user.id);
  if (existing) throw new Error("You already sent an offer for this ride.");

  const rewardAmount = Number(input.rewardAmount);
  if (!Number.isFinite(rewardAmount) || rewardAmount < 0) {
    throw new Error("Enter a valid reward amount.");
  }

  const { data, error } = await client
    .from("ride_offers")
    .insert({
      ride_id: input.rideId,
      driver_name: input.driverName.trim() || "Guest",
      user_id: user.id,
      pitch: input.pitch.trim(),
      reward_amount: rewardAmount,
      currency: input.currency ?? "INR",
    })
    .select(OFFER_SELECT)
    .single();

  if (error || !data) throw error ?? new Error("Could not send offer.");
  return mapOffer(data as OfferRow);
}

export async function pickRideOfferRemote(
  client: SupabaseClient,
  rideId: string,
  offerId: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

  const ride = await fetchRideById(client, rideId);
  if (!ride) throw new Error("Ride request not found.");
  if (ride.riderUserId !== user.id) throw new Error("Only the rider can pick a driver.");
  if (ride.status !== "open") throw new Error("This ride is no longer open.");

  const offer = ride.offers.find((entry) => entry.id === offerId);
  if (!offer || offer.status !== "pending") throw new Error("Offer not found.");

  const { error: rideErr } = await client
    .from("ride_requests")
    .update({ status: "matched", matched_offer_id: offerId })
    .eq("id", rideId)
    .eq("user_id", user.id);

  if (rideErr) throw rideErr;

  await client.from("ride_offers").update({ status: "accepted" }).eq("id", offerId);

  const otherIds = ride.offers
    .filter((entry) => entry.id !== offerId && entry.status === "pending")
    .map((entry) => entry.id);

  if (otherIds.length > 0) {
    await client.from("ride_offers").update({ status: "rejected" }).in("id", otherIds);
  }
}

export async function completeRideRemote(
  client: SupabaseClient,
  rideId: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

  const ride = await fetchRideById(client, rideId);
  if (!ride) throw new Error("Ride request not found.");
  if (ride.status !== "matched") throw new Error("This ride is not in progress.");

  const matched = ride.offers.find((offer) => offer.id === ride.matchedOfferId);
  if (!matched || matched.driverUserId !== user.id) {
    throw new Error("Only the matched driver can mark the drop complete.");
  }

  const { error } = await client
    .from("ride_requests")
    .update({ status: "completed" })
    .eq("id", rideId);

  if (error) throw error;
}

export async function rewardRideRemote(
  client: SupabaseClient,
  rideId: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

  const ride = await fetchRideById(client, rideId);
  if (!ride) throw new Error("Ride request not found.");
  if (ride.riderUserId !== user.id) throw new Error("Only the rider can send the reward.");
  if (ride.status !== "completed") throw new Error("Mark the drop complete first.");

  const matched = ride.offers.find((offer) => offer.id === ride.matchedOfferId);
  if (!matched) throw new Error("Matched driver not found.");

  const { error } = await client
    .from("ride_requests")
    .update({
      status: "rewarded",
      reward_paid_amount: matched.rewardAmount,
      currency: matched.currency,
      rewarded_at: new Date().toISOString(),
    })
    .eq("id", rideId)
    .eq("user_id", user.id);

  if (error) throw error;

  if (matched.driverUserId) {
    await awardChakraRemote(
      client,
      matched.driverUserId,
      chakraPointsForDuty(matched.rewardAmount),
    );
  }
}

export async function cancelRideRemote(
  client: SupabaseClient,
  rideId: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

  const { data, error } = await client
    .from("ride_requests")
    .delete()
    .eq("id", rideId)
    .eq("user_id", user.id)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new Error("Could not remove this ride request.");
}
