import type { RideLiveLocation } from "@/lib/types/ride-location";

export async function fetchRideLiveLocations(): Promise<RideLiveLocation[]> {
  return [];
}

export async function upsertRideLiveLocation(): Promise<void> {
  console.warn("Mongo live ride location persistence is not implemented yet.");
}

export async function setRideLocationSharing(): Promise<void> {
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
