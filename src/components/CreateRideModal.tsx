"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { MapPoint } from "@/components/RideLocationPickerMap";
import { reverseGeocodeLabel } from "@/lib/geocoding";
import {
  getStoredRideRiderName,
  setStoredRideRiderName,
} from "@/lib/ride-names";
import { yellowButtonMdClass } from "@/lib/ui";

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
  const [maxReward, setMaxReward] = useState("");
  const [pickup, setPickup] = useState<MapPoint | null>(null);
  const [drop, setDrop] = useState<MapPoint | null>(null);
  const [activeField, setActiveField] = useState<"pickup" | "drop">("pickup");
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRiderName(getStoredRideRiderName());
    setPickupLabel("");
    setDropLabel("");
    setNotes("");
    setMaxReward("");
    setPickup(null);
    setDrop(null);
    setActiveField("pickup");
    setUserLocation(null);

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
    } finally {
      setGeocoding(false);
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
        setUserLocation({ lat, lng });
        setActiveField("pickup");
        setPickup({ lat, lng });
        setPickupLabel(await reverseGeocodeLabel(lat, lng));
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

  const fieldBtnClass = (field: "pickup" | "drop") =>
    `flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition ${
      activeField === field
        ? "border-brand bg-brand-soft text-brand"
        : "border-border bg-background text-foreground hover:bg-surface"
    }`;

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
            maxReward: budget != null && Number.isFinite(budget) ? budget : undefined,
          });
        }}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="create-ride-title"
      >
        <h2 id="create-ride-title" className="text-sm font-bold text-foreground">
          Drop me — request a ride
        </h2>
        <p className="mt-1 text-xs text-subtle">
          Tap the map to set pickup (A) and drop (B). You can edit the names below.
        </p>

        <div className="mt-3 flex gap-2">
          <button type="button" className={fieldBtnClass("pickup")} onClick={() => setActiveField("pickup")}>
            A · Pickup {pickup ? "✓" : ""}
          </button>
          <button type="button" className={fieldBtnClass("drop")} onClick={() => setActiveField("drop")}>
            B · Drop {drop ? "✓" : ""}
          </button>
        </div>

        <p className="mt-2 text-[11px] text-subtle">
          {activeField === "pickup"
            ? "Tap the map to set where you want to be picked up."
            : "Tap the map to set where you want to be dropped."}
          {geocoding ? " Finding place name…" : ""}
        </p>

        <div className="mt-2">
          <RideLocationPickerMap
            pickup={pickup}
            drop={drop}
            activeField={activeField}
            onMapClick={(lat, lng) => void setPointFromMap(lat, lng)}
            userLocation={userLocation}
          />
        </div>

        <button
          type="button"
          onClick={useMyLocationForPickup}
          disabled={locating}
          className="mt-2 text-xs font-bold text-brand hover:underline disabled:opacity-50"
        >
          {locating ? "Getting location…" : "Use my location for pickup"}
        </button>

        <label className="mt-3 block space-y-1">
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
          <span className="text-xs font-semibold text-foreground">Pick me up at</span>
          <input
            value={pickupLabel}
            onChange={(e) => setPickupLabel(e.target.value)}
            placeholder="Tap map or type a place"
            maxLength={200}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-semibold text-foreground">Drop me at</span>
          <input
            value={dropLabel}
            onChange={(e) => setDropLabel(e.target.value)}
            placeholder="Tap map or type a place"
            maxLength={200}
            required
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

        <div className="mt-5 flex justify-end gap-2">
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
