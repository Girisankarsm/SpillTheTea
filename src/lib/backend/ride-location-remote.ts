import type { RideLiveLocation, RideLiveLocations } from "@/lib/types/ride-location";

export async function fetchRideLiveLocations(
  ..._args: unknown[]
): Promise<RideLiveLocations> {
  return { rider: null, driver: null };
}

export async function upsertRideLiveLocation(..._args: unknown[]): Promise<void> {
  console.warn("Mongo live ride location persistence is not implemented yet.");
}

export async function setRideLocationSharing(..._args: unknown[]): Promise<void> {
  console.warn("Mongo live ride location sharing is not implemented yet.");
}

export function mapRideLiveLocationRow(row: {
  ride_id: string;
  user_id: string;
  role: "rider" | "driver";
  lat: number;
  lng: number;
  sharing: boolean;
  updated_at: string;
}): RideLiveLocation {
  return {
    rideId: row.ride_id,
    userId: row.user_id,
    role: row.role,
    lat: row.lat,
    lng: row.lng,
    sharing: row.sharing,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function mergeRideLiveLocation(
  current: RideLiveLocations,
  location: RideLiveLocation,
): RideLiveLocations {
  if (location.role === "rider") {
    return { ...current, rider: location };
  }
  return { ...current, driver: location };
}
