"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildUpiPayUrl,
  normalizePaymentPhone,
  normalizeUpiId,
  phoneTelUrl,
  type PayeePaymentInfo,
} from "@/lib/payments/upi";
import { fetchPayeePaymentRemote } from "@/lib/supabase/profile-remote";
import { formatMoney } from "@/lib/types/duty";

type PayHelperPanelProps = {
  supabase?: SupabaseClient | null;
  payeeUserId?: string;
  payeeName: string;
  amount: number;
  currency?: string;
  dutyId?: string;
  rideId?: string;
  /** Person paying sees UPI / phone / cash options */
  payerView?: boolean;
  /** Helper/driver sees setup prompt */
  payeeView?: boolean;
  contextLabel?: string;
};

export function PayHelperPanel({
  supabase,
  payeeUserId,
  payeeName,
  amount,
  currency = "INR",
  dutyId,
  rideId,
  payerView = false,
  payeeView = false,
  contextLabel = "SpillTheTea",
}: PayHelperPanelProps) {
  const [payment, setPayment] = useState<PayeePaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!payerView || !supabase || !payeeUserId || (!dutyId && !rideId)) {
      setPayment(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchPayeePaymentRemote(supabase, payeeUserId, { dutyId, rideId })
      .then((info) => {
        if (!cancelled) setPayment(info);
      })
      .catch(() => {
        if (!cancelled) setPayment(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [payerView, supabase, payeeUserId, dutyId, rideId]);

  const upiId = payment?.paymentUpi ? normalizeUpiId(payment.paymentUpi) : null;
  const phone = payment?.paymentPhone
    ? normalizePaymentPhone(payment.paymentPhone)
    : null;
  const amountLabel = formatMoney(amount, currency);

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      alert(`Copy manually: ${value}`);
    }
  }

  if (!payerView && !payeeView) return null;

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h2 className="text-sm font-bold text-foreground">Pay {payeeName}</h2>
      <p className="mt-1 text-xs text-subtle">
        Agreed amount: <strong className="text-foreground">{amountLabel}</strong> — pay
        directly via UPI/GPay, phone, or cash.
      </p>

      {payerView ? (
        <div className="mt-3 space-y-2">
          {loading ? (
            <p className="text-xs text-subtle">Loading payment details…</p>
          ) : null}

          {upiId ? (
            <a
              href={buildUpiPayUrl({
                upiId,
                payeeName,
                amount,
                note: contextLabel,
              })}
              className="flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              Pay {amountLabel} via UPI / GPay
            </a>
          ) : null}

          {phone ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={phoneTelUrl(phone)}
                className="flex flex-1 items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground hover:bg-brand-soft"
              >
                Call {phone}
              </a>
              <button
                type="button"
                onClick={() => void copyText("phone", phone)}
                className="flex flex-1 items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground hover:bg-brand-soft"
              >
                {copied === "phone" ? "Copied ✓" : "Copy number"}
              </button>
            </div>
          ) : null}

          {!loading && !upiId && !phone ? (
            <p className="rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs text-subtle">
              {payeeName} hasn&apos;t added UPI or phone on their profile yet. Coordinate
              payment in chat or pay cash in person.
            </p>
          ) : null}

          <div className="rounded-lg border border-border bg-background px-3 py-2.5">
            <p className="text-xs font-bold text-foreground">Pay cash</p>
            <p className="mt-1 text-xs text-subtle">
              Hand {amountLabel} in cash when the {contextLabel.toLowerCase()} is done.
              Then tap <strong>Send reward</strong> in the app to record it.
            </p>
          </div>
        </div>
      ) : null}

      {payeeView ? (
        <p className="mt-3 text-xs text-subtle">
          The poster pays you after you&apos;re assigned.{" "}
          <Link href="/profile" className="font-bold text-brand hover:underline">
            Add UPI or phone on your profile
          </Link>{" "}
          — only they can see it, not the public.
        </p>
      ) : null}
    </section>
  );
}
