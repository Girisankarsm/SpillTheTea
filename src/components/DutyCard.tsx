import Link from "next/link";
import {
  dutyStatusLabel,
  formatMoney,
  type DutyWithOffers,
} from "@/lib/types/duty";

type DutyCardProps = {
  duty: DutyWithOffers;
  isAuthor?: boolean;
};

export function DutyCard({ duty, isAuthor = false }: DutyCardProps) {
  const pendingOffers = duty.offers.filter((offer) => offer.status === "pending").length;
  const lowestOffer = duty.offers
    .filter((offer) => offer.status === "pending")
    .sort((a, b) => a.rewardAmount - b.rewardAmount)[0];

  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
              Duty
            </span>
            <span className="text-[11px] font-semibold text-subtle">
              {dutyStatusLabel(duty.status)}
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground">{duty.title}</h2>
          <p className="line-clamp-2 text-sm text-subtle">{duty.description}</p>
          <p className="text-xs text-subtle">
            by {duty.authorName}
            {isAuthor && pendingOffers > 0
              ? ` · ${pendingOffers} offer${pendingOffers === 1 ? "" : "s"}`
              : ""}
            {isAuthor && lowestOffer
              ? ` · from ${formatMoney(lowestOffer.rewardAmount, lowestOffer.currency)}`
              : ""}
          </p>
        </div>
        <Link
          href={`/duties/${duty.id}`}
          className="flex w-full shrink-0 items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 sm:w-auto"
        >
          View
        </Link>
      </div>
    </article>
  );
}
