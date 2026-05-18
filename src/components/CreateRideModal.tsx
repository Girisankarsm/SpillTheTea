"use client";

import { useEffect, useState } from "react";
import {
  getStoredRideRiderName,
  setStoredRideRiderName,
} from "@/lib/ride-names";
import { yellowButtonMdClass } from "@/lib/ui";

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
  const [pickupLat, setPickupLat] = useState<number | undefined>();
  const [pickupLng, setPickupLng] = useState<number | undefined>();
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRiderName(getStoredRideRiderName());
    setPickupLabel("");
    setDropLabel("");
    setNotes("");
    setMaxReward("");
    setPickupLat(undefined);
    setPickupLng(undefined);
  }, [open]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert("Location is not available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupLat(pos.coords.latitude);
        setPickupLng(pos.coords.longitude);
        if (!pickupLabel.trim()) setPickupLabel("My current location");
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
            pickupLabel,
            pickupLat,
            pickupLng,
            dropLabel,
            notes,
            maxReward: budget != null && Number.isFinite(budget) ? budget : undefined,
          });
        }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="create-ride-title"
      >
        <h2 id="create-ride-title" className="text-sm font-bold text-foreground">
          Drop me — request a ride
        </h2>
        <p className="mt-1 text-xs text-subtle">
          Say where you are and where you want to go. Someone heading that way can
          offer to drop you for a reward.
        </p>

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
            placeholder="e.g. VIT main gate"
            maxLength={200}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="text-xs font-bold text-brand hover:underline disabled:opacity-50"
          >
            {locating ? "Getting location…" : "Use my current location"}
          </button>
        </label>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-semibold text-foreground">Drop me at</span>
          <input
            value={dropLabel}
            onChange={(e) => setDropLabel(e.target.value)}
            placeholder="e.g. Katpadi station"
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
            disabled={disabled}
            className={`${yellowButtonMdClass} px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Post request
          </button>
        </div>
      </form>
    </div>
  );
}
