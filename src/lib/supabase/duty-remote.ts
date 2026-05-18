import type { SupabaseClient } from "@supabase/supabase-js";
import { chakraPointsForDuty } from "@/lib/chakra";
import { awardChakraRemote } from "@/lib/supabase/profile-remote";
import type {
  CreateDutyInput,
  CreateDutyOfferInput,
  Duty,
  DutyOffer,
  DutyStatus,
  DutyWithOffers,
} from "@/lib/types/duty";

type DutyRow = {
  id: string;
  title: string;
  description: string;
  author_name: string;
  user_id: string;
  status: DutyStatus;
  assigned_offer_id: string | null;
  reward_paid_amount: number | null;
  currency: string;
  rewarded_at: string | null;
  created_at: string;
};

type OfferRow = {
  id: string;
  duty_id: string;
  helper_name: string;
  user_id: string;
  pitch: string;
  reward_amount: number;
  currency: string;
  status: DutyOffer["status"];
  created_at: string;
};

function mapDuty(row: DutyRow): Duty {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    authorName: row.author_name || "Guest",
    authorUserId: row.user_id,
    status: row.status,
    assignedOfferId: row.assigned_offer_id ?? undefined,
    rewardPaidAmount:
      row.reward_paid_amount != null ? Number(row.reward_paid_amount) : undefined,
    currency: row.currency || "INR",
    rewardedAt: row.rewarded_at ? new Date(row.rewarded_at).getTime() : undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function mapOffer(row: OfferRow): DutyOffer {
  return {
    id: row.id,
    dutyId: row.duty_id,
    helperName: row.helper_name || "Guest",
    helperUserId: row.user_id,
    pitch: row.pitch || "",
    rewardAmount: Number(row.reward_amount),
    currency: row.currency || "INR",
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function attachOffers(duties: Duty[], offers: DutyOffer[]): DutyWithOffers[] {
  const byDuty = new Map<string, DutyOffer[]>();
  for (const offer of offers) {
    const list = byDuty.get(offer.dutyId) ?? [];
    list.push(offer);
    byDuty.set(offer.dutyId, list);
  }
  return duties.map((duty) => ({
    ...duty,
    offers: (byDuty.get(duty.id) ?? []).sort((a, b) => a.createdAt - b.createdAt),
  }));
}

export async function fetchDuties(client: SupabaseClient): Promise<DutyWithOffers[]> {
  const { data: dutyRows, error: dutyErr } = await client
    .from("duties")
    .select(
      "id, title, description, author_name, user_id, status, assigned_offer_id, reward_paid_amount, currency, rewarded_at, created_at",
    )
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (dutyErr) throw dutyErr;
  if (!dutyRows?.length) return [];

  const dutyIds = dutyRows.map((row) => row.id as string);
  const { data: offerRows, error: offerErr } = await client
    .from("duty_offers")
    .select(
      "id, duty_id, helper_name, user_id, pitch, reward_amount, currency, status, created_at",
    )
    .in("duty_id", dutyIds)
    .order("created_at", { ascending: true });

  if (offerErr) throw offerErr;

  return attachOffers(
    (dutyRows as DutyRow[]).map(mapDuty),
    ((offerRows ?? []) as OfferRow[]).map(mapOffer),
  );
}

export async function fetchDutyById(
  client: SupabaseClient,
  dutyId: string,
): Promise<DutyWithOffers | null> {
  const { data: dutyRow, error: dutyErr } = await client
    .from("duties")
    .select(
      "id, title, description, author_name, user_id, status, assigned_offer_id, reward_paid_amount, currency, rewarded_at, created_at",
    )
    .eq("id", dutyId)
    .maybeSingle();

  if (dutyErr) throw dutyErr;
  if (!dutyRow) return null;

  const { data: offerRows, error: offerErr } = await client
    .from("duty_offers")
    .select(
      "id, duty_id, helper_name, user_id, pitch, reward_amount, currency, status, created_at",
    )
    .eq("duty_id", dutyId)
    .order("created_at", { ascending: true });

  if (offerErr) throw offerErr;

  const duty = mapDuty(dutyRow as DutyRow);
  return {
    ...duty,
    offers: ((offerRows ?? []) as OfferRow[]).map(mapOffer),
  };
}

export async function createDutyRemote(
  client: SupabaseClient,
  input: CreateDutyInput,
): Promise<Duty> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to post a duty.");

  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) throw new Error("Add a title and description.");

  const { data, error } = await client
    .from("duties")
    .insert({
      title,
      description,
      author_name: input.authorName.trim() || "Guest",
      user_id: user.id,
    })
    .select(
      "id, title, description, author_name, user_id, status, assigned_offer_id, reward_paid_amount, currency, rewarded_at, created_at",
    )
    .single();

  if (error || !data) throw error ?? new Error("Could not create duty.");
  return mapDuty(data as DutyRow);
}

export async function createDutyOfferRemote(
  client: SupabaseClient,
  input: CreateDutyOfferInput,
): Promise<DutyOffer> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to offer help.");

  const duty = await fetchDutyById(client, input.dutyId);
  if (!duty) throw new Error("Duty not found.");
  if (duty.status !== "open") throw new Error("This duty is no longer open.");
  if (duty.authorUserId === user.id) throw new Error("You cannot offer on your own duty.");

  const existing = duty.offers.find((offer) => offer.helperUserId === user.id);
  if (existing) throw new Error("You already sent an offer for this duty.");

  const rewardAmount = Number(input.rewardAmount);
  if (!Number.isFinite(rewardAmount) || rewardAmount < 0) {
    throw new Error("Enter a valid reward amount.");
  }

  const { data, error } = await client
    .from("duty_offers")
    .insert({
      duty_id: input.dutyId,
      helper_name: input.helperName.trim() || "Guest",
      user_id: user.id,
      pitch: input.pitch.trim(),
      reward_amount: rewardAmount,
      currency: input.currency ?? "INR",
    })
    .select(
      "id, duty_id, helper_name, user_id, pitch, reward_amount, currency, status, created_at",
    )
    .single();

  if (error || !data) throw error ?? new Error("Could not send offer.");
  return mapOffer(data as OfferRow);
}

export async function pickDutyOfferRemote(
  client: SupabaseClient,
  dutyId: string,
  offerId: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

  const duty = await fetchDutyById(client, dutyId);
  if (!duty) throw new Error("Duty not found.");
  if (duty.authorUserId !== user.id) throw new Error("Only the author can pick a helper.");
  if (duty.status !== "open") throw new Error("This duty is no longer open.");

  const offer = duty.offers.find((entry) => entry.id === offerId);
  if (!offer || offer.status !== "pending") throw new Error("Offer not found.");

  const { error: dutyErr } = await client
    .from("duties")
    .update({
      status: "assigned",
      assigned_offer_id: offerId,
    })
    .eq("id", dutyId)
    .eq("user_id", user.id);

  if (dutyErr) throw dutyErr;

  const { error: acceptErr } = await client
    .from("duty_offers")
    .update({ status: "accepted" })
    .eq("id", offerId);

  if (acceptErr) throw acceptErr;

  const otherIds = duty.offers
    .filter((entry) => entry.id !== offerId && entry.status === "pending")
    .map((entry) => entry.id);

  if (otherIds.length > 0) {
    const { error: rejectErr } = await client
      .from("duty_offers")
      .update({ status: "rejected" })
      .in("id", otherIds);
    if (rejectErr) throw rejectErr;
  }
}

export async function completeDutyRemote(
  client: SupabaseClient,
  dutyId: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

  const duty = await fetchDutyById(client, dutyId);
  if (!duty) throw new Error("Duty not found.");
  if (duty.status !== "assigned") throw new Error("This duty is not in progress.");

  const assigned = duty.offers.find((offer) => offer.id === duty.assignedOfferId);
  if (!assigned || assigned.helperUserId !== user.id) {
    throw new Error("Only the assigned helper can mark this done.");
  }

  const { error } = await client
    .from("duties")
    .update({ status: "completed" })
    .eq("id", dutyId);

  if (error) throw error;
}

export async function rewardDutyRemote(
  client: SupabaseClient,
  dutyId: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

  const duty = await fetchDutyById(client, dutyId);
  if (!duty) throw new Error("Duty not found.");
  if (duty.authorUserId !== user.id) throw new Error("Only the author can send the reward.");
  if (duty.status !== "completed") throw new Error("Mark the task complete first.");

  const assigned = duty.offers.find((offer) => offer.id === duty.assignedOfferId);
  if (!assigned) throw new Error("Assigned helper not found.");

  const { error } = await client
    .from("duties")
    .update({
      status: "rewarded",
      reward_paid_amount: assigned.rewardAmount,
      currency: assigned.currency,
      rewarded_at: new Date().toISOString(),
    })
    .eq("id", dutyId)
    .eq("user_id", user.id);

  if (error) throw error;

  if (assigned.helperUserId) {
    await awardChakraRemote(
      client,
      assigned.helperUserId,
      chakraPointsForDuty(assigned.rewardAmount),
    );
  }
}

export async function cancelDutyRemote(
  client: SupabaseClient,
  dutyId: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

  const { data, error } = await client
    .from("duties")
    .delete()
    .eq("id", dutyId)
    .eq("user_id", user.id)
    .in("status", ["open", "assigned"])
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new Error("Could not remove this duty.");
}
