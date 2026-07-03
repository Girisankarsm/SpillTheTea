import type {
  CreateRideInput,
  CreateRideOfferInput,
  RideWithOffers,
} from "@/lib/types/ride";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export async function fetchRides(_client?: unknown): Promise<RideWithOffers[]> {
  const data = await jsonFetch<{ rides: RideWithOffers[] }>("/api/rides");
  return data.rides;
}

export async function fetchRideById(
  _client: unknown,
  rideId: string,
): Promise<RideWithOffers | null> {
  const response = await fetch(`/api/rides/${encodeURIComponent(rideId)}`);
  if (response.status === 404) return null;
  const data = (await response.json()) as { ride: RideWithOffers; error?: string };
  if (!response.ok) throw new Error(data.error || "Could not load ride.");
  return data.ride;
}

export async function createRideRemote(
  _client: unknown,
  input: CreateRideInput,
): Promise<string> {
  const data = await jsonFetch<{ id: string }>("/api/rides", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.id;
}

export async function createRideOfferRemote(
  _client: unknown,
  input: CreateRideOfferInput,
): Promise<string> {
  const data = await jsonFetch<{ id: string }>(
    `/api/rides/${encodeURIComponent(input.rideId)}/offers`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return data.id;
}

export async function pickRideOfferRemote(
  _client: unknown,
  rideId: string,
  offerId: string,
): Promise<void> {
  await jsonFetch(`/api/rides/${encodeURIComponent(rideId)}/offers`, {
    method: "POST",
    body: JSON.stringify({ action: "pick", offerId }),
  });
}

export async function completeRideRemote(
  _client: unknown,
  rideId: string,
): Promise<void> {
  await jsonFetch(`/api/rides/${encodeURIComponent(rideId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "completed" }),
  });
}

export async function rewardRideRemote(
  _client: unknown,
  rideId: string,
  amount?: number,
): Promise<void> {
  await jsonFetch(`/api/rides/${encodeURIComponent(rideId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "rewarded",
      extra: { rewardPaidAmount: amount, rewardedAt: new Date().toISOString() },
    }),
  });
}

export async function cancelRideRemote(
  _client: unknown,
  rideId: string,
): Promise<void> {
  await jsonFetch(`/api/rides/${encodeURIComponent(rideId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "open" }),
  });
}
