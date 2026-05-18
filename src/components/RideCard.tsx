import Link from "next/link";
import {
  formatMoney,
  rideStatusLabel,
  type RideWithOffers,
} from "@/lib/types/ride";
import { formatDistanceKm } from "@/lib/geo";
import { yellowButtonMdClass } from "@/lib/ui";

type RideCardProps = {
  ride: RideWithOffers;
  isRider?: boolean;
  distanceKm?: number;
};

export function RideCard({ ride, isRider = false, distanceKm }: RideCardProps) {
  const pendingOffers = ride.offers.filter((offer) => offer.status === "pending").length;
  const lowestOffer = ride.offers
    .filter((offer) => offer.status === "pending")
    .sort((a, b) => a.rewardAmount - b.rewardAmount)[0];

  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
              Drop me
            </span>
            <span className="text-[11px] font-semibold text-subtle">
              {rideStatusLabel(ride.status)}
            </span>
          </div>
          <p className="text-sm font-bold text-foreground">
            {ride.pickupLabel} → {ride.dropLabel}
          </p>
          {ride.notes ? (
            <p className="line-clamp-2 text-sm text-subtle">{ride.notes}</p>
          ) : null}
          <p className="text-xs text-subtle">
            by {ride.riderName}
            {ride.maxReward != null ? ` · up to ${formatMoney(ride.maxReward, ride.currency)}` : ""}
            {distanceKm != null ? ` · ${formatDistanceKm(distanceKm)}` : ""}
            {isRider && pendingOffers > 0
              ? ` · ${pendingOffers} offer${pendingOffers === 1 ? "" : "s"}`
              : ""}
            {isRider && lowestOffer
              ? ` · from ${formatMoney(lowestOffer.rewardAmount, lowestOffer.currency)}`
              : ""}
          </p>
        </div>
        <Link href={`/rides/${ride.id}`} className={`${yellowButtonMdClass} w-full sm:w-auto`}>
          View
        </Link>
      </div>
    </article>
  );
}
