const RIDER_NAME_KEY = "ride-pool-rider-name";
const DRIVER_NAME_KEY = "ride-pool-driver-name";

export function getStoredRideRiderName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(RIDER_NAME_KEY)?.trim() ?? "";
}

export function setStoredRideRiderName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RIDER_NAME_KEY, name.trim());
}

export function getStoredRideDriverName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DRIVER_NAME_KEY)?.trim() ?? "";
}

export function setStoredRideDriverName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRIVER_NAME_KEY, name.trim());
}
