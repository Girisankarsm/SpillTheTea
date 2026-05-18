import { distanceKm } from "@/lib/geo";

export const NEARBY_RADIUS_KM = 15;

export function isPlottable(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function isNearby(
  lat: number,
  lng: number,
  userLat: number,
  userLng: number,
  radiusKm = NEARBY_RADIUS_KM,
): boolean {
  return distanceKm(userLat, userLng, lat, lng) <= radiusKm;
}

export function hotspotRadiusMeters(messageCount: number, hot: boolean): number {
  const base = hot ? 220 : 140;
  return Math.min(900, base + messageCount * 35);
}

export function sortByDistance<T>(
  items: T[],
  userLat: number,
  userLng: number,
  getCoords: (item: T) => { lat: number; lng: number } | null,
): T[] {
  return [...items].sort((a, b) => {
    const aCoords = getCoords(a);
    const bCoords = getCoords(b);
    if (!aCoords && !bCoords) return 0;
    if (!aCoords) return 1;
    if (!bCoords) return -1;
    return (
      distanceKm(userLat, userLng, aCoords.lat, aCoords.lng) -
      distanceKm(userLat, userLng, bCoords.lat, bCoords.lng)
    );
  });
}
