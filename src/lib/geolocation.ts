export type GeoPoint = { lat: number; lng: number };

let cachedLocation: GeoPoint | null = null;

export function readCachedUserLocation(): GeoPoint | null {
  return cachedLocation;
}

/** Best-effort browser location for pinning tea on the map. */
export function getUserLocation(options?: { timeoutMs?: number }): Promise<GeoPoint | null> {
  if (cachedLocation) return Promise.resolve(cachedLocation);
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cachedLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        resolve(cachedLocation);
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: options?.timeoutMs ?? 10_000,
        maximumAge: 120_000,
      },
    );
  });
}

export function primeUserLocation(): void {
  void getUserLocation({ timeoutMs: 12_000 });
}
