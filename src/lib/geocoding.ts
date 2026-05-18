/** Short label from coordinates when reverse geocoding is unavailable. */
export function formatCoordLabel(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export { formatPlaceLabel } from "@/lib/place-search";

/** Reverse geocode lat/lng to a short place name (OpenStreetMap Nominatim). */
export async function reverseGeocodeLabel(
  lat: number,
  lng: number,
): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("zoom", "16");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return formatCoordLabel(lat, lng);

    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };

    const addr = data.address;
    if (addr) {
      const parts = [
        addr.amenity,
        addr.building,
        addr.road,
        addr.suburb,
        addr.neighbourhood,
        addr.city,
        addr.town,
        addr.village,
      ].filter(Boolean);
      if (parts.length > 0) return [...new Set(parts)].slice(0, 2).join(", ");
    }

    if (data.display_name) {
      return data.display_name.split(",").slice(0, 2).join(",").trim();
    }

    return formatCoordLabel(lat, lng);
  } catch {
    return formatCoordLabel(lat, lng);
  }
}
