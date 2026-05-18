"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LocationSearchInput } from "@/components/LocationSearchInput";
import type { MapPoint } from "@/components/RideLocationPickerMap";
import { reverseGeocodeLabel } from "@/lib/geocoding";
import {
  getStoredRideRiderName,
  setStoredRideRiderName,
} from "@/lib/ride-names";
import type { PlaceSuggestion } from "@/lib/types/place-search";
import type { RideVehiclePreference } from "@/lib/types/ride-vehicle";
import { yellowButtonMdClass } from "@/lib/ui";
import { VehicleTypePicker } from "@/components/VehicleTypePicker";

const RideLocationPickerMap = dynamic(
  () =>
    import("@/components/RideLocationPickerMap").then((m) => ({
      default: m.RideLocationPickerMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-52 items-center justify-center rounded-xl border border-border bg-background text-xs text-subtle sm:h-56">
        Loading map…
      </div>
    ),
  },
);

type CreateRideModalProps = {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    riderName: string;
    pickupLabel: string;
    pickupLat?: number;
    pickupLng?: number;
    dropLabel: string;
    dropLat?: number;
    dropLng?: number;
    notes: string;
    vehiclePreference: string;
    vehicleDetail: string;
    maxReward?: number;
  }) => void;
};

export function CreateRideModal({
  open,
  disabled,
  onClose,
  onSubmit,
}: CreateRideModalProps) {
  const [riderName, setRiderName] = useState("");
  const [pickupLabel, setPickupLabel] = useState("");
  const [dropLabel, setDropLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [vehiclePreference, setVehiclePreference] = useState<RideVehiclePreference>("any");
  const [vehicleDetail, setVehicleDetail] = useState("");
  const [maxReward, setMaxReward] = useState("");
  const [pickup, setPickup] = useState<MapPoint | null>(null);
  const [drop, setDrop] = useState<MapPoint | null>(null);
  const [activeField, setActiveField] = useState<"pickup" | "drop">("pickup");
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapFlyTo, setMapFlyTo] = useState<MapPoint | null>(null);

  useEffect(() => {
    if (!open) return;
    setRiderName(getStoredRideRiderName());
    setPickupLabel("");
    setDropLabel("");
    setNotes("");
    setVehiclePreference("any");
    setVehicleDetail("");
    setMaxReward("");
    setPickup(null);
    setDrop(null);
    setActiveField("pickup");
    setUserLocation(null);
    setMapFlyTo(null);

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, [open]);

  async function setPointFromMap(lat: number, lng: number) {
    setGeocoding(true);
    try {
      const label = await reverseGeocodeLabel(lat, lng);
      if (activeField === "pickup") {
        setPickup({ lat, lng });
        setPickupLabel(label);
      } else {
        setDrop({ lat, lng });
        setDropLabel(label);
      }
      setMapFlyTo({ lat, lng });
    } finally {
      setGeocoding(false);
    }
  }

  function selectPlace(field: "pickup" | "drop", place: PlaceSuggestion) {
    const point = { lat: place.lat, lng: place.lng };
    setActiveField(field);
    setMapFlyTo(point);
    if (field === "pickup") {
      setPickup(point);
      setPickupLabel(place.label);
    } else {
      setDrop(point);
      setDropLabel(place.label);
    }
  }

  function useMyLocationForPickup() {
    if (!navigator.geolocation) {
      alert("Location is not available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const point = { lat, lng };
        setUserLocation(point);
        setActiveField("pickup");
        setPickup(point);
        setPickupLabel(await reverseGeocodeLabel(lat, lng));
        setMapFlyTo(point);
        setLocating(false);
      },
      () => {
        alert("Could not get your location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  if (!open) return null;

  const searchBias = userLocation ?? pickup ?? drop ?? undefined;

  return (
    <div
      className="fixed inset-0 z-[600] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmedName = riderName.trim() || "anon";
          setStoredRideRiderName(trimmedName);
          const budget = maxReward.trim() ? Number(maxReward) : undefined;
          onSubmit({
            riderName: trimmedName,
            pickupLabel: pickupLabel.trim() || "Pickup",
            pickupLat: pickup?.lat,
            pickupLng: pickup?.lng,
            dropLabel: dropLabel.trim() || "Drop",
            dropLat: drop?.lat,
            dropLng: drop?.lng,
            notes,
            vehiclePreference,
            vehicleDetail,
            maxReward: budget != null && Number.isFinite(budget) ? budget : undefined,
          });
        }}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="create-ride-title"
      >
        <div className="shrink-0 border-b border-border p-5 pb-4">
          <h2 id="create-ride-title" className="text-sm font-bold text-foreground">
            Drop me — request a ride
          </h2>
          <p className="mt-1 text-xs text-subtle">
            Search pickup and drop like Rapido — pick from the list or tap the map.
          </p>

          <div className="mt-4 rounded-xl border border-border bg-background p-3">
            <LocationSearchInput
              label="Pickup"
              variant="pickup"
              value={pickupLabel}
              onChange={(next) => {
                setPickupLabel(next);
                setPickup(null);
              }}
              onFocus={() => setActiveField("pickup")}
              onSelect={(place) => selectPlace("pickup", place)}
              placeholder="Where should the driver pick you up?"
              active={activeField === "pickup"}
              selected={!!pickup}
              required
              biasLat={searchBias?.lat}
              biasLng={searchBias?.lng}
            />

            <div className="ml-1.5 h-4 border-l-2 border-dashed border-border" aria-hidden />

            <LocationSearchInput
              label="Drop"
              variant="drop"
              value={dropLabel}
              onChange={(next) => {
                setDropLabel(next);
                setDrop(null);
              }}
              onFocus={() => setActiveField("drop")}
              onSelect={(place) => selectPlace("drop", place)}
              placeholder="Where do you want to go? e.g. SRM University"
              active={activeField === "drop"}
              selected={!!drop}
              required
              biasLat={searchBias?.lat}
              biasLng={searchBias?.lng}
            />
          </div>

          <button
            type="button"
            onClick={useMyLocationForPickup}
            disabled={locating}
            className="mt-3 text-xs font-bold text-brand hover:underline disabled:opacity-50"
          >
            {locating ? "Getting location…" : "Use my current location for pickup"}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-4">
          <p className="text-[11px] text-subtle">
            {activeField === "pickup"
              ? "Or tap the map to pin pickup (A)."
              : "Or tap the map to pin drop (B)."}
            {geocoding ? " Finding place name…" : ""}
          </p>

          <div className="mt-2">
            <RideLocationPickerMap
              pickup={pickup}
              drop={drop}
              activeField={activeField}
              onMapClick={(lat, lng) => void setPointFromMap(lat, lng)}
              userLocation={userLocation}
              flyTo={mapFlyTo}
            />
          </div>

          <div className="mt-4">
            <VehicleTypePicker
              label="What vehicle do you need?"
              value={vehiclePreference}
              onChange={setVehiclePreference}
              allowAny
            />
          </div>

          <label className="mt-3 block space-y-1">
            <span className="text-xs font-semibold text-foreground">
              Vehicle details (optional)
            </span>
            <input
              value={vehicleDetail}
              onChange={(e) => setVehicleDetail(e.target.value)}
              placeholder="e.g. need AC car, 2 people with bags…"
              maxLength={200}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          <label className="mt-4 block space-y-1">
            <span className="text-xs font-semibold text-foreground">Your name</span>
            <input
              value={riderName}
              onChange={(e) => setRiderName(e.target.value)}
              placeholder="anon"
              maxLength={80}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          <label className="mt-3 block space-y-1">
            <span className="text-xs font-semibold text-foreground">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="When you need to leave, how many people…"
              rows={2}
              maxLength={1000}
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          <label className="mt-3 block space-y-1">
            <span className="text-xs font-semibold text-foreground">
              Max reward you&apos;ll pay (₹, optional)
            </span>
            <input
              type="number"
              min={0}
              step={1}
              value={maxReward}
              onChange={(e) => setMaxReward(e.target.value)}
              placeholder="50"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-subtle hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disabled || geocoding}
            className={`${yellowButtonMdClass} px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Post request
          </button>
        </div>
      </form>
    </div>
  );
}
