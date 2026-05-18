"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RideDetailPanel } from "@/components/RideDetailPanel";
import { RideOfferModal } from "@/components/RideOfferModal";
import { useSupabase } from "@/components/SupabaseProvider";
import { unknownErrorMessage } from "@/lib/error-message";
import { setStoredRideDriverName } from "@/lib/ride-names";
import { getCurrentUserId } from "@/lib/supabase/meet-greet-remote";
import {
  cancelRideRemote,
  completeRideRemote,
  createRideOfferRemote,
  fetchRideById,
  pickRideOfferRemote,
  rewardRideRemote,
} from "@/lib/supabase/ride-remote";
import { formatMoney, type RideWithOffers } from "@/lib/types/ride";

export default function RideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rideId = typeof params?.id === "string" ? params.id : "";

  const { supabase, remoteReady } = useSupabase();

  const [ride, setRide] = useState<RideWithOffers | null>(null);
  const [loaded, setLoaded] = useState(!remoteReady);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const rideChat =
    remoteReady && supabase && currentUserId && rideId
      ? { rideId, supabase, currentUserId }
      : null;

  const reload = useCallback(async () => {
    if (!supabase || !remoteReady || !rideId) return;
    try {
      setRide(await fetchRideById(supabase, rideId));
      setCurrentUserId(await getCurrentUserId(supabase));
      setError(null);
    } catch (e) {
      setError(unknownErrorMessage(e, "Could not load ride request."));
    }
  }, [supabase, remoteReady, rideId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!remoteReady || !supabase || !rideId) {
        if (!cancelled) setLoaded(true);
        return;
      }
      void (async () => {
        if (!cancelled) setLoaded(false);
        try {
          setRide(await fetchRideById(supabase, rideId));
          setCurrentUserId(await getCurrentUserId(supabase));
        } catch (e) {
          if (!cancelled) {
            setError(unknownErrorMessage(e, "Could not load ride request."));
          }
        } finally {
          if (!cancelled) setLoaded(true);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [remoteReady, supabase, rideId]);

  useEffect(() => {
    if (!supabase || !remoteReady || !rideId) return;
    const channel = supabase
      .channel(`ride-${rideId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_requests", filter: `id=eq.${rideId}` },
        () => void reload(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_offers", filter: `ride_id=eq.${rideId}` },
        () => void reload(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, remoteReady, rideId, reload]);

  async function handleOffer(input: {
    driverName: string;
    pitch: string;
    rewardAmount: number;
  }) {
    if (!rideId) return;
    setStoredRideDriverName(input.driverName);
    setBusy(true);
    try {
      if (!supabase) throw new Error("Sign in to offer a ride.");
      await createRideOfferRemote(supabase, {
        rideId,
        driverName: input.driverName,
        pitch: input.pitch,
        rewardAmount: input.rewardAmount,
      });
      setOfferOpen(false);
      await reload();
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not send offer."));
    } finally {
      setBusy(false);
    }
  }

  async function handlePickOffer(offerId: string) {
    if (!rideId || !supabase) return;
    if (!window.confirm("Pick this driver for the ride?")) return;
    setBusy(true);
    try {
      await pickRideOfferRemote(supabase, rideId, offerId);
      await reload();
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not pick driver."));
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!rideId || !supabase) return;
    setBusy(true);
    try {
      await completeRideRemote(supabase, rideId);
      await reload();
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not mark complete."));
    } finally {
      setBusy(false);
    }
  }

  async function handleReward() {
    if (!rideId || !ride || !supabase) return;
    const matched = ride.offers.find((offer) => offer.id === ride.matchedOfferId);
    const amountLabel = matched
      ? formatMoney(matched.rewardAmount, matched.currency)
      : "the agreed amount";

    if (
      !window.confirm(
        `Record ${amountLabel} reward in the app? You'll still pay the driver via UPI/cash.`,
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      await rewardRideRemote(supabase, rideId);
      await reload();
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not send reward."));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!rideId || !ride || !supabase) return;
    if (!window.confirm("Remove this ride request?")) return;
    setBusy(true);
    try {
      await cancelRideRemote(supabase, rideId);
      router.replace("/rides");
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not remove ride request."));
    } finally {
      setBusy(false);
    }
  }

  if (!rideId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-subtle">Missing ride id.</p>
      </div>
    );
  }

  if (remoteReady && !loaded) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-subtle">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16">
        <p className="text-sm text-danger-text">{error}</p>
        <Link href="/rides" className="text-sm font-bold text-brand hover:underline">
          ← All rides
        </Link>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16">
        <h1 className="text-xl font-bold text-foreground">Not found</h1>
        <Link href="/rides" className="text-sm font-bold text-brand hover:underline">
          ← All rides
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-6 sm:py-10">
      <Link href="/rides" className="text-sm font-semibold text-brand hover:underline">
        ← Ride pooling
      </Link>

      <div className="mt-4">
        <RideDetailPanel
          ride={ride}
          viewerUserId={currentUserId}
          busy={busy}
          onOffer={() => setOfferOpen(true)}
          onPickOffer={(offerId) => void handlePickOffer(offerId)}
          onComplete={() => void handleComplete()}
          onReward={() => void handleReward()}
          onCancel={() => void handleCancel()}
          chat={rideChat}
        />
      </div>

      <RideOfferModal
        open={offerOpen}
        disabled={busy}
        onClose={() => setOfferOpen(false)}
        onSubmit={(input) => void handleOffer(input)}
      />
    </div>
  );
}
