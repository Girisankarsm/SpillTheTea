import { NextResponse } from "next/server";
import { formatPlaceLabel, dedupePlaces } from "@/lib/place-search";
import type { PlaceSuggestion } from "@/lib/types/place-search";

export const dynamic = "force-dynamic";

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
  name?: string;
  address?: Record<string, string>;
};

async function searchPhoton(
  q: string,
  lat?: string | null,
  lon?: string | null,
): Promise<PlaceSuggestion[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "10");
  url.searchParams.set("lang", "en");
  if (lat && lon) {
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return [];

  const json = (await res.json()) as { features?: PhotonFeature[] };
  return (json.features ?? []).map((feature, index) => {
    const [lng, latCoord] = feature.geometry.coordinates;
    const props = feature.properties;
    const { label, subtitle } = formatPlaceLabel({
      name: props.name,
      street: props.street,
      district: props.district,
      city: props.city ?? props.locality ?? props.county,
      state: props.state,
      country: props.country,
    });

    return {
      id: `photon-${latCoord}-${lng}-${index}`,
      label,
      subtitle,
      lat: latCoord,
      lng,
    };
  });
}

async function searchNominatim(
  q: string,
  lat?: string | null,
  lon?: string | null,
): Promise<PlaceSuggestion[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "in");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": "SpillTheTea/1.0 (ride location search)",
    },
    cache: "no-store",
  });
  if (!res.ok) return [];

  const rows = (await res.json()) as NominatimResult[];
  return rows.map((row, index) => {
    const latCoord = Number(row.lat);
    const lng = Number(row.lon);
    const addr = row.address ?? {};
    const { label, subtitle } = formatPlaceLabel({
      name: row.name,
      street: addr.road ?? addr.pedestrian,
      district: addr.suburb ?? addr.neighbourhood,
      city: addr.city ?? addr.town ?? addr.village ?? addr.county,
      state: addr.state,
      country: addr.country,
    });

    const fallbackLabel =
      label !== "Selected place"
        ? label
        : (row.display_name?.split(",").slice(0, 2).join(",").trim() ?? label);

    return {
      id: `nominatim-${latCoord}-${lng}-${index}`,
      label: fallbackLabel,
      subtitle: subtitle || row.display_name?.split(",").slice(2, 5).join(",").trim() || "",
      lat: latCoord,
      lng,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (q.length < 1) {
    return NextResponse.json({ places: [] satisfies PlaceSuggestion[] });
  }

  try {
    const [photonPlaces, nominatimPlaces] = await Promise.all([
      searchPhoton(q, lat, lon),
      q.length >= 2 ? searchNominatim(q, lat, lon) : Promise.resolve([]),
    ]);

    const merged = dedupePlaces([...photonPlaces, ...nominatimPlaces]).slice(0, 10);

    return NextResponse.json({ places: merged });
  } catch {
    return NextResponse.json(
      { error: "Could not search places right now." },
      { status: 502 },
    );
  }
}
