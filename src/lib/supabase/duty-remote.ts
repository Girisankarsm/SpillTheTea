import type {
  CreateDutyInput,
  CreateDutyOfferInput,
  DutyWithOffers,
} from "@/lib/types/duty";

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

export async function fetchDuties(_client?: unknown): Promise<DutyWithOffers[]> {
  const data = await jsonFetch<{ duties: DutyWithOffers[] }>("/api/duties");
  return data.duties;
}

export async function fetchDutyById(
  _client: unknown,
  dutyId: string,
): Promise<DutyWithOffers | null> {
  const response = await fetch(`/api/duties/${encodeURIComponent(dutyId)}`);
  if (response.status === 404) return null;
  const data = (await response.json()) as { duty: DutyWithOffers; error?: string };
  if (!response.ok) throw new Error(data.error || "Could not load duty.");
  return data.duty;
}

export async function createDutyRemote(
  _client: unknown,
  input: CreateDutyInput,
): Promise<string> {
  const data = await jsonFetch<{ id: string }>("/api/duties", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.id;
}

export async function createDutyOfferRemote(
  _client: unknown,
  input: CreateDutyOfferInput,
): Promise<string> {
  const data = await jsonFetch<{ id: string }>(
    `/api/duties/${encodeURIComponent(input.dutyId)}/offers`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return data.id;
}

export async function pickDutyOfferRemote(
  _client: unknown,
  dutyId: string,
  offerId: string,
): Promise<void> {
  await jsonFetch(`/api/duties/${encodeURIComponent(dutyId)}/offers`, {
    method: "POST",
    body: JSON.stringify({ action: "pick", offerId }),
  });
}

export async function completeDutyRemote(
  _client: unknown,
  dutyId: string,
): Promise<void> {
  await jsonFetch(`/api/duties/${encodeURIComponent(dutyId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "completed" }),
  });
}

export async function rewardDutyRemote(
  _client: unknown,
  dutyId: string,
  amount?: number,
): Promise<void> {
  await jsonFetch(`/api/duties/${encodeURIComponent(dutyId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "rewarded",
      extra: { rewardPaidAmount: amount, rewardedAt: new Date().toISOString() },
    }),
  });
}

export async function cancelDutyRemote(
  _client: unknown,
  dutyId: string,
): Promise<void> {
  await jsonFetch(`/api/duties/${encodeURIComponent(dutyId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "open" }),
  });
}
