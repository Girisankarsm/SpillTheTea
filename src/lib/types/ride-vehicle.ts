export type RideVehicleType = "car" | "bike" | "scooter" | "auto";
export type RideVehiclePreference = RideVehicleType | "any";

export const RIDE_VEHICLE_OPTIONS: {
  id: RideVehicleType;
  label: string;
  emoji: string;
}[] = [
  { id: "car", label: "Car", emoji: "🚗" },
  { id: "bike", label: "Bike", emoji: "🏍️" },
  { id: "scooter", label: "Scooter", emoji: "🛵" },
  { id: "auto", label: "Auto", emoji: "🛺" },
];

export const RIDE_VEHICLE_PREFERENCE_OPTIONS: {
  id: RideVehiclePreference;
  label: string;
  emoji: string;
}[] = [
  ...RIDE_VEHICLE_OPTIONS,
  { id: "any", label: "Any", emoji: "✨" },
];

export function rideVehicleEmoji(type: string | undefined): string {
  return (
    RIDE_VEHICLE_PREFERENCE_OPTIONS.find((option) => option.id === type)?.emoji ?? "🚗"
  );
}

export function rideVehicleLabel(type: string | undefined): string {
  return (
    RIDE_VEHICLE_PREFERENCE_OPTIONS.find((option) => option.id === type)?.label ??
    "Vehicle"
  );
}

export function formatRideVehicle(type: string | undefined, detail?: string): string {
  const base = `${rideVehicleEmoji(type)} ${rideVehicleLabel(type)}`;
  const trimmed = detail?.trim();
  return trimmed ? `${base} · ${trimmed}` : base;
}
