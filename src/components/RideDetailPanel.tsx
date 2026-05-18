"use client";

import {
  canRiderRemoveRide,
  formatMoney,
  rideStatusLabel,
  type RideWithOffers,
} from "@/lib/types/ride";
import { RideChatPanel } from "@/components/RideChatPanel";
import { PayHelperPanel } from "@/components/PayHelperPanel";
import { RideLiveTrackingPanel } from "@/components/RideLiveTrackingPanel";
import { RideRouteSummary } from "@/components/RideRouteSummary";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatRideVehicle } from "@/lib/types/ride-vehicle";

type RideDetailPanelProps = {
  ride: RideWithOffers;
  viewerUserId?: string | null;
  busy?: boolean;
  onOffer: () => void;
  onPickOffer: (offerId: string) => void;
  onComplete: () => void;
  onReward: () => void;
  onCancel: () => void;
  chat?: {
    rideId: string;
    supabase: SupabaseClient;
    currentUserId: string;
  } | null;
};

function isRider(ride: RideWithOffers, viewerUserId?: string | null): boolean {
  return !!viewerUserId && ride.riderUserId === viewerUserId;
}

function isMatchedDriver(
  ride: RideWithOffers,
  viewerUserId?: string | null,
): boolean {
  const matched = ride.offers.find((offer) => offer.id === ride.matchedOfferId);
  if (!matched) return false;
  return !!viewerUserId && matched.driverUserId === viewerUserId;
}

function hasPendingOffer(
  ride: RideWithOffers,
  viewerUserId?: string | null,
): boolean {
  return ride.offers.some(
    (offer) =>
      offer.status === "pending" &&
      !!viewerUserId &&
      offer.driverUserId === viewerUserId,
  );
}

export function RideDetailPanel({
  ride,
  viewerUserId,
  busy,
  onOffer,
  onPickOffer,
  onComplete,
  onReward,
  onCancel,
  chat,
}: RideDetailPanelProps) {
  const rider = isRider(ride, viewerUserId);
  const driver = isMatchedDriver(ride, viewerUserId);
  const alreadyOffered = hasPendingOffer(ride, viewerUserId);
  const matchedOffer = ride.offers.find((offer) => offer.id === ride.matchedOfferId);
  const pendingOffers = ride.offers.filter((offer) => offer.status === "pending");
  const showPrivateChat =
    !!chat &&
    (rider || driver) &&
    !!matchedOffer?.driverUserId &&
    !!ride.riderUserId &&
    ride.status !== "open";
  const showLiveTracking =
    !!chat &&
    (rider || driver) &&
    !!matchedOffer &&
    ["matched", "completed"].includes(ride.status);

  const showPayment =
    !!matchedOffer &&
    ride.status !== "open" &&
    ride.status !== "rewarded" &&
    matchedOffer.rewardAmount > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
            🚗 Ride pool
          </span>
          <span className="text-xs font-semibold text-subtle">
            {rideStatusLabel(ride.status)}
          </span>
        </div>

        <div className="mt-4">
          <RideRouteSummary pickupLabel={ride.pickupLabel} dropLabel={ride.dropLabel} />
        </div>

        <p className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
          <span className="text-[10px] font-bold uppercase tracking-wide text-subtle">
            Rider needs
          </span>
          <span className="mt-0.5 block font-semibold">
            {formatRideVehicle(ride.vehiclePreference, ride.vehicleDetail)}
          </span>
        </p>

        {ride.notes ? (
          <p className="mt-3 text-sm text-subtle">{ride.notes}</p>
        ) : null}

        <p className="mt-3 text-xs text-subtle">
          Posted by <span className="font-bold text-foreground">{ride.riderName}</span>
          {ride.maxReward != null
            ? ` · budget up to ${formatMoney(ride.maxReward, ride.currency)}`
            : ""}
        </p>

        {rider && ride.status === "rewarded" && ride.rewardPaidAmount != null ? (
          <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm font-semibold text-brand">
            Rewarded {formatMoney(ride.rewardPaidAmount, ride.currency)} through the app
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {!rider && ride.status === "open" && !alreadyOffered ? (
            <button
              type="button"
              onClick={onOffer}
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              🚗 I can drop you
            </button>
          ) : null}

          {driver && ride.status === "matched" ? (
            <button
              type="button"
              onClick={onComplete}
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              Mark drop complete
            </button>
          ) : null}

          {rider && ride.status === "completed" ? (
            <button
              type="button"
              onClick={onReward}
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              Send reward
              {matchedOffer
                ? ` (${formatMoney(matchedOffer.rewardAmount, matchedOffer.currency)})`
                : ""}
            </button>
          ) : null}

          {rider && canRiderRemoveRide(ride.status) ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-danger-border bg-danger-bg px-4 py-2 text-sm font-bold text-danger-text hover:opacity-90 disabled:opacity-50"
            >
              Remove request
            </button>
          ) : null}
        </div>
      </section>

      {showPayment && matchedOffer ? (
        <PayHelperPanel
          supabase={chat?.supabase}
          payeeUserId={matchedOffer.driverUserId}
          payeeName={matchedOffer.driverName}
          amount={matchedOffer.rewardAmount}
          currency={matchedOffer.currency}
          payerView={rider}
          payeeView={driver}
          contextLabel="Ride"
        />
      ) : null}

      {showLiveTracking && chat && matchedOffer ? (
        <RideLiveTrackingPanel
          ride={ride}
          supabase={chat.supabase}
          currentUserId={chat.currentUserId}
          isRider={rider}
          isDriver={driver}
        />
      ) : null}

      {showPrivateChat && matchedOffer && chat ? (
        <RideChatPanel
          rideId={chat.rideId}
          supabase={chat.supabase}
          currentUserId={chat.currentUserId}
          riderUserId={ride.riderUserId!}
          riderName={ride.riderName}
          driverUserId={matchedOffer.driverUserId!}
          driverName={matchedOffer.driverName}
          driverRewardAmount={matchedOffer.rewardAmount}
          driverCurrency={matchedOffer.currency}
          driverPitch={matchedOffer.pitch}
        />
      ) : (rider || driver) && matchedOffer && ride.status !== "open" ? (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-bold text-foreground">🚗 Matched driver</h2>
          <p className="mt-2 text-sm text-foreground">
            <span className="font-bold">{matchedOffer.driverName}</span>
            {" · "}
            {formatMoney(matchedOffer.rewardAmount, matchedOffer.currency)}
          </p>
          <p className="mt-1 text-sm text-subtle">
            {formatRideVehicle(matchedOffer.vehicleType, matchedOffer.vehicleDetail)}
          </p>
          {matchedOffer.pitch ? (
            <p className="mt-2 text-sm text-subtle">{matchedOffer.pitch}</p>
          ) : null}
        </section>
      ) : null}

      {rider && pendingOffers.length > 0 && ride.status === "open" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">
            Driver offers ({pendingOffers.length})
          </h2>
          {pendingOffers.map((offer) => (
            <article
              key={offer.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    🚗 {offer.driverName}
                  </p>
                  <p className="text-sm font-semibold text-brand">
                    {formatRideVehicle(offer.vehicleType, offer.vehicleDetail)}
                  </p>
                  <p className="text-sm font-semibold text-brand">
                    Wants {formatMoney(offer.rewardAmount, offer.currency)}
                  </p>
                  {offer.pitch ? (
                    <p className="text-sm text-subtle">{offer.pitch}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onPickOffer(offer.id)}
                  disabled={busy}
                  className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  Pick driver
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {!rider && ride.status === "open" && alreadyOffered ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-subtle">
          🚗 Your offer is in — waiting for the rider to pick someone.
        </p>
      ) : null}

      {rider && ride.status === "open" && pendingOffers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-3 text-sm text-subtle">
          No driver offers yet. Someone going your way can tap 🚗 I can drop you.
        </p>
      ) : null}

      {rider && ride.status === "matched" ? (
        <p className="rounded-lg border border-border bg-brand-soft px-4 py-3 text-sm text-foreground">
          Driver matched! Tap <strong>Share my live location</strong> so they can find you at pickup.
        </p>
      ) : null}

      {rider && ride.status === "completed" ? (
        <p className="rounded-lg border border-border bg-brand-soft px-4 py-3 text-sm text-foreground">
          Driver marked the drop complete. Pay via UPI/GPay, phone, or cash above — then
          tap <strong>Send reward</strong> to record it in the app.
        </p>
      ) : null}
    </div>
  );
}
