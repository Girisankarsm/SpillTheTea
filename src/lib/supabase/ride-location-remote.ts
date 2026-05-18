import type { SupabaseClient } from "@supabase/supabase-js";
import type { RideLiveLocation, RideLiveLocations } from "@/lib/types/ride-location";

type LocationRow = {
  ride_id: string;
  user_id: string;
  role: "rider" | "driver";
  lat: number;
  lng: number;
  sharing: boolean;
  updated_at: string;
};

const SELECT = "ride_id, user_id, role, lat, lng, sharing, updated_at";

function mapRow(row: LocationRow): RideLiveLocation {
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

export async function fetchRideLiveLocations(
  client: SupabaseClient,
  rideId: string,
): Promise<RideLiveLocations> {
  const { data, error } = await client
    .from("ride_live_locations")
    .select(SELECT)
    .eq("ride_id", rideId);

  if (error) throw error;

  const rows = (data ?? []) as LocationRow[];
  const riderRow = rows.find((row) => row.role === "rider");
  const driverRow = rows.find((row) => row.role === "driver");

  return {
    rider: riderRow ? mapRow(riderRow) : null,
    driver: driverRow ? mapRow(driverRow) : null,
  };
}

export async function upsertRideLiveLocation(
  client: SupabaseClient,
  rideId: string,
  role: "rider" | "driver",
  lat: number,
  lng: number,
  sharing: boolean,
): Promise<RideLiveLocation> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to share location.");

  const { data, error } = await client
    .from("ride_live_locations")
    .upsert(
      {
        ride_id: rideId,
        user_id: user.id,
        role,
        lat,
        lng,
        sharing,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ride_id,user_id" },
    )
    .select(SELECT)
    .single();

  if (error || !data) throw error ?? new Error("Could not update location.");
  return mapRow(data as LocationRow);
}

export async function setRideLocationSharing(
  client: SupabaseClient,
  rideId: string,
  role: "rider" | "driver",
  sharing: boolean,
  lat?: number,
  lng?: number,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to share location.");

  if (lat != null && lng != null) {
    await upsertRideLiveLocation(client, rideId, role, lat, lng, sharing);
    return;
  }

  const { error } = await client
    .from("ride_live_locations")
    .update({ sharing, updated_at: new Date().toISOString() })
    .eq("ride_id", rideId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export function mapRideLiveLocationRow(row: LocationRow): RideLiveLocation {
  return mapRow(row);
}
