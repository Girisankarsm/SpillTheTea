"use client";

import { useEffect, useState } from "react";
import {
  getStoredRideDriverName,
  setStoredRideDriverName,
} from "@/lib/ride-names";
import type { RideVehicleType } from "@/lib/types/ride-vehicle";
import { yellowButtonMdClass } from "@/lib/ui";
import { VehicleTypePicker } from "@/components/VehicleTypePicker";

type RideOfferModalProps = {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    driverName: string;
    pitch: string;
    vehicleType: string;
    vehicleDetail: string;
    rewardAmount: number;
  }) => void;
};

export function RideOfferModal({
  open,
  disabled,
  onClose,
  onSubmit,
}: RideOfferModalProps) {
  const [driverName, setDriverName] = useState("");
  const [pitch, setPitch] = useState("");
  const [vehicleType, setVehicleType] = useState<RideVehicleType>("car");
  const [vehicleDetail, setVehicleDetail] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");

  useEffect(() => {
    if (!open) return;
    setDriverName(getStoredRideDriverName());
    setPitch("");
    setVehicleType("car");
    setVehicleDetail("");
    setRewardAmount("");
  }, [open]);

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
          const trimmedName = driverName.trim() || "anon";
          setStoredRideDriverName(trimmedName);
          onSubmit({
            driverName: trimmedName,
            pitch,
            vehicleType,
            vehicleDetail,
            rewardAmount: Number(rewardAmount),
          });
        }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-bold text-foreground">🚗 I can drop you</h2>
        <p className="mt-1 text-xs text-subtle">
          Say what vehicle you have and what reward you want.
        </p>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-semibold text-foreground">Your name</span>
          <input
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="anon"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <div className="mt-3">
          <VehicleTypePicker
            label="Your vehicle"
            value={vehicleType}
            onChange={(value) => setVehicleType(value as RideVehicleType)}
          />
        </div>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-semibold text-foreground">
            Vehicle details (optional)
          </span>
          <input
            value={vehicleDetail}
            onChange={(e) => setVehicleDetail(e.target.value)}
            placeholder="e.g. White Swift, 4 seats, AC…"
            maxLength={200}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-semibold text-foreground">Reward you want (₹)</span>
          <input
            type="number"
            min={0}
            step={1}
            required
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-semibold text-foreground">Message</span>
          <textarea
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder="Passing by in 15 min, have space for 1…"
            rows={3}
            maxLength={1000}
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-subtle"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disabled}
            className={`${yellowButtonMdClass} px-4 py-2 disabled:opacity-50`}
          >
            Send offer
          </button>
        </div>
      </form>
    </div>
  );
}
