"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { DutyChatPanel } from "@/components/DutyChatPanel";
import { PayHelperPanel } from "@/components/PayHelperPanel";
import {
  dutyStatusLabel,
  formatMoney,
  canAuthorRemoveDuty,
  type DutyWithOffers,
} from "@/lib/types/duty";
import { DutyPersonLabel } from "@/components/DutyPersonLabel";

type DutyDetailPanelProps = {
  duty: DutyWithOffers;
  viewerKey: string | null;
  viewerUserId?: string | null;
  busy?: boolean;
  onOffer: () => void;
  onPickOffer: (offerId: string) => void;
  onComplete: () => void;
  onReward: () => void;
  onCancel: () => void;
  chat?: {
    dutyId: string;
    supabase: SupabaseClient;
    currentUserId: string;
  } | null;
};

function isAuthor(
  duty: DutyWithOffers,
  viewerKey: string | null,
  viewerUserId?: string | null,
): boolean {
  if (viewerUserId && duty.authorUserId) return duty.authorUserId === viewerUserId;
  if (viewerKey && duty.authorVisitorId) return duty.authorVisitorId === viewerKey;
  return false;
}

function isAssignedHelper(
  duty: DutyWithOffers,
  viewerKey: string | null,
  viewerUserId?: string | null,
): boolean {
  const assigned = duty.offers.find((offer) => offer.id === duty.assignedOfferId);
  if (!assigned) return false;
  if (viewerUserId && assigned.helperUserId) return assigned.helperUserId === viewerUserId;
  if (viewerKey && assigned.helperVisitorId) return assigned.helperVisitorId === viewerKey;
  return false;
}

function hasPendingOffer(
  duty: DutyWithOffers,
  viewerKey: string | null,
  viewerUserId?: string | null,
): boolean {
  return duty.offers.some((offer) => {
    if (offer.status !== "pending") return false;
    if (viewerUserId && offer.helperUserId) return offer.helperUserId === viewerUserId;
    if (viewerKey && offer.helperVisitorId) return offer.helperVisitorId === viewerKey;
    return false;
  });
}

export function DutyDetailPanel({
  duty,
  viewerKey,
  viewerUserId,
  busy,
  onOffer,
  onPickOffer,
  onComplete,
  onReward,
  onCancel,
  chat,
}: DutyDetailPanelProps) {
  const author = isAuthor(duty, viewerKey, viewerUserId);
  const helper = isAssignedHelper(duty, viewerKey, viewerUserId);
  const alreadyOffered = hasPendingOffer(duty, viewerKey, viewerUserId);
  const assignedOffer = duty.offers.find((offer) => offer.id === duty.assignedOfferId);
  const pendingOffers = duty.offers.filter((offer) => offer.status === "pending");
  const showPrivateChat =
    !!chat &&
    (author || helper) &&
    !!assignedOffer?.helperUserId &&
    !!duty.authorUserId &&
    duty.status !== "open";

  const showPayment =
    !!assignedOffer &&
    duty.status !== "open" &&
    duty.status !== "rewarded" &&
    assignedOffer.rewardAmount > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
            Duty
          </span>
          <span className="text-xs font-semibold text-subtle">
            {dutyStatusLabel(duty.status)}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-foreground">{duty.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {duty.description}
        </p>
        <p className="mt-3 text-xs text-subtle">
          Posted by{" "}
          <DutyPersonLabel
            name={duty.authorName}
            userId={duty.authorUserId}
            visitorId={duty.authorVisitorId}
          />
        </p>

        {author && duty.status === "rewarded" && duty.rewardPaidAmount != null ? (
          <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm font-semibold text-brand">
            Rewarded {formatMoney(duty.rewardPaidAmount, duty.currency)} through the app
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {!author && duty.status === "open" && !alreadyOffered ? (
            <button
              type="button"
              onClick={onOffer}
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              I&apos;ll do it
            </button>
          ) : null}

          {helper && duty.status === "assigned" ? (
            <button
              type="button"
              onClick={onComplete}
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              Mark complete
            </button>
          ) : null}

          {author && duty.status === "completed" ? (
            <button
              type="button"
              onClick={onReward}
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              Send reward
              {assignedOffer
                ? ` (${formatMoney(assignedOffer.rewardAmount, assignedOffer.currency)})`
                : ""}
            </button>
          ) : null}

          {author && canAuthorRemoveDuty(duty.status) ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-danger-border bg-danger-bg px-4 py-2 text-sm font-bold text-danger-text hover:opacity-90 disabled:opacity-50"
            >
              Remove duty
            </button>
          ) : null}
        </div>
      </section>

      {showPayment && assignedOffer ? (
        <PayHelperPanel
          supabase={chat?.supabase}
          payeeUserId={assignedOffer.helperUserId}
          payeeName={assignedOffer.helperName}
          amount={assignedOffer.rewardAmount}
          currency={assignedOffer.currency}
          payerView={author}
          payeeView={helper}
          contextLabel="Duty"
        />
      ) : null}

      {showPrivateChat && assignedOffer && chat ? (
        <DutyChatPanel
          dutyId={chat.dutyId}
          supabase={chat.supabase}
          currentUserId={chat.currentUserId}
          authorUserId={duty.authorUserId!}
          authorName={duty.authorName}
          helperUserId={assignedOffer.helperUserId!}
          helperName={assignedOffer.helperName}
          helperRewardAmount={assignedOffer.rewardAmount}
          helperCurrency={assignedOffer.currency}
          helperPitch={assignedOffer.pitch}
        />
      ) : (author || helper) && assignedOffer && duty.status !== "open" ? (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-bold text-foreground">Assigned helper</h2>
          <p className="mt-2 text-sm text-foreground">
            <DutyPersonLabel
              name={assignedOffer.helperName}
              userId={assignedOffer.helperUserId}
              visitorId={assignedOffer.helperVisitorId}
            />
            {" · "}
            {formatMoney(assignedOffer.rewardAmount, assignedOffer.currency)}
          </p>
          {assignedOffer.pitch ? (
            <p className="mt-2 text-sm text-subtle">{assignedOffer.pitch}</p>
          ) : null}
        </section>
      ) : null}

      {author && pendingOffers.length > 0 && duty.status === "open" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">
            Offers ({pendingOffers.length})
          </h2>
          {pendingOffers.map((offer) => (
            <article
              key={offer.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm">
                    <DutyPersonLabel
                      name={offer.helperName}
                      userId={offer.helperUserId}
                      visitorId={offer.helperVisitorId}
                    />
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
                  Pick helper
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {!author && duty.status === "open" && alreadyOffered ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-subtle">
          Your offer is in — waiting for the author to pick someone.
        </p>
      ) : null}

      {author && duty.status === "open" && pendingOffers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-3 text-sm text-subtle">
          No offers yet. Share this duty so people can help.
        </p>
      ) : null}

      {author && duty.status === "completed" ? (
        <p className="rounded-lg border border-border bg-brand-soft px-4 py-3 text-sm text-foreground">
          Helper marked this done. Pay via UPI/GPay, phone, or cash above — then tap{" "}
          <strong>Send reward</strong> to record it in the app.
        </p>
      ) : null}
    </div>
  );
}
