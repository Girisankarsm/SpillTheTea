"use client";

import { useEffect, useState } from "react";
import {
  getStoredDutyHelperName,
  setStoredDutyHelperName,
} from "@/lib/duty-names";

type DutyOfferModalProps = {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    pitch: string;
    rewardAmount: number;
    helperName: string;
  }) => void;
};

export function DutyOfferModal({
  open,
  disabled,
  onClose,
  onSubmit,
}: DutyOfferModalProps) {
  const [pitch, setPitch] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [helperName, setHelperName] = useState("");

  useEffect(() => {
    if (!open) return;
    setPitch("");
    setRewardAmount("");
    setHelperName(getStoredDutyHelperName());
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
          const trimmedName = helperName.trim() || "anon";
          setStoredDutyHelperName(trimmedName);
          onSubmit({
            pitch,
            rewardAmount: Number(rewardAmount),
            helperName: trimmedName,
          });
        }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="duty-offer-title"
      >
        <h2 id="duty-offer-title" className="text-sm font-bold text-foreground">
          Offer to help
        </h2>
        <p className="mt-1 text-xs text-subtle">
          Say you&apos;re in — and how much you&apos;d like for doing it.
        </p>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-semibold text-foreground">Your name on this offer</span>
          <input
            value={helperName}
            onChange={(e) => setHelperName(e.target.value)}
            placeholder="anon"
            maxLength={80}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-semibold text-foreground">Your pitch</span>
          <textarea
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder="I can do this today because…"
            rows={3}
            maxLength={1000}
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-semibold text-foreground">Reward you want (₹)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
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
            className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send offer
          </button>
        </div>
      </form>
    </div>
  );
}
