"use client";

import type { RideVehiclePreference, RideVehicleType } from "@/lib/types/ride-vehicle";
import {
  RIDE_VEHICLE_OPTIONS,
  RIDE_VEHICLE_PREFERENCE_OPTIONS,
} from "@/lib/types/ride-vehicle";

type VehicleTypePickerProps = {
  label: string;
  value: RideVehiclePreference | RideVehicleType;
  onChange: (value: RideVehiclePreference | RideVehicleType) => void;
  allowAny?: boolean;
};

export function VehicleTypePicker({
  label,
  value,
  onChange,
  allowAny = false,
}: VehicleTypePickerProps) {
  const options = allowAny ? RIDE_VEHICLE_PREFERENCE_OPTIONS : RIDE_VEHICLE_OPTIONS;

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition ${
                active
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-border bg-background text-foreground hover:bg-surface"
              }`}
            >
              <span className="mr-1.5" aria-hidden>
                {option.emoji}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
