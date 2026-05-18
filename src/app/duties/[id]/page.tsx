"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DutyChatPanel } from "@/components/DutyChatPanel";
import { DutyDetailPanel } from "@/components/DutyDetailPanel";
import { DutyOfferModal } from "@/components/DutyOfferModal";
import { useSupabase } from "@/components/SupabaseProvider";
import { unknownErrorMessage } from "@/lib/error-message";
import { setStoredDutyHelperName } from "@/lib/duty-names";
import { chakraPointsForDuty } from "@/lib/chakra";
import {
  cancelDutyRemote,
  completeDutyRemote,
  createDutyOfferRemote,
  fetchDutyById,
  pickDutyOfferRemote,
  rewardDutyRemote,
} from "@/lib/supabase/duty-remote";
import { getCurrentUserId } from "@/lib/supabase/meet-greet-remote";
import { getDutyWithOffers, useMeetGreetStore } from "@/lib/store";
import { useProfileStore } from "@/lib/profile-store";
import type { DutyWithOffers } from "@/lib/types/duty";
import { formatMoney } from "@/lib/types/duty";
import { getVisitorId } from "@/lib/visitor";

export default function DutyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dutyId = typeof params?.id === "string" ? params.id : "";

  const { supabase, remoteReady } = useSupabase();

  const localDuties = useMeetGreetStore((s) => s.duties);
  const localOffers = useMeetGreetStore((s) => s.dutyOffers);
  const createOfferLocal = useMeetGreetStore((s) => s.createDutyOffer);
  const pickOfferLocal = useMeetGreetStore((s) => s.pickDutyOffer);
  const completeLocal = useMeetGreetStore((s) => s.completeDuty);
  const rewardLocal = useMeetGreetStore((s) => s.rewardDuty);
  const cancelLocal = useMeetGreetStore((s) => s.cancelDuty);

  const [remoteDuty, setRemoteDuty] = useState<DutyWithOffers | null>(null);
  const [loaded, setLoaded] = useState(!remoteReady);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [helperName, setHelperName] = useState("Guest");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const localDuty = useMemo(
    () => getDutyWithOffers(dutyId, localDuties, localOffers),
    [dutyId, localDuties, localOffers],
  );

  const duty = remoteReady ? remoteDuty : localDuty;
  const viewerKey = getVisitorId();
  const assignedOffer = duty?.offers.find((offer) => offer.id === duty.assignedOfferId);
  const canUseDutyChat =
    remoteReady &&
    !!supabase &&
    !!currentUserId &&
    !!duty?.authorUserId &&
    !!assignedOffer?.helperUserId &&
    duty.status !== "open" &&
    (duty.authorUserId === currentUserId ||
      assignedOffer.helperUserId === currentUserId);

  const reload = useCallback(async () => {
    if (!supabase || !remoteReady || !dutyId) return;
    try {
      setRemoteDuty(await fetchDutyById(supabase, dutyId));
      setCurrentUserId(await getCurrentUserId(supabase));
      setError(null);
    } catch (e) {
      setError(unknownErrorMessage(e, "Could not load duty."));
    }
  }, [supabase, remoteReady, dutyId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!remoteReady || !supabase || !dutyId) {
        if (!cancelled) setLoaded(true);
        return;
      }

      void (async () => {
        if (!cancelled) setLoaded(false);
        try {
          const row = await fetchDutyById(supabase, dutyId);
          if (cancelled) return;
          setRemoteDuty(row);
          setCurrentUserId(await getCurrentUserId(supabase));
        } catch (e) {
          if (!cancelled) {
            setError(unknownErrorMessage(e, "Could not load duty."));
          }
        } finally {
          if (!cancelled) setLoaded(true);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [remoteReady, supabase, dutyId]);

  useEffect(() => {
    if (!supabase || !remoteReady || !dutyId) return;
    const channel = supabase
      .channel(`duty-${dutyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duties", filter: `id=eq.${dutyId}` },
        () => void reload(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duty_offers", filter: `duty_id=eq.${dutyId}` },
        () => void reload(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, remoteReady, dutyId, reload]);

  async function handleOffer(input: {
    pitch: string;
    rewardAmount: number;
    helperName: string;
  }) {
    if (!dutyId) return;
    const postingName = input.helperName.trim() || "anon";
    setStoredDutyHelperName(postingName);

    setBusy(true);
    try {
      if (remoteReady && supabase) {
        await createDutyOfferRemote(supabase, {
          dutyId,
          helperName: postingName,
          pitch: input.pitch,
          rewardAmount: input.rewardAmount,
        });
        setOfferOpen(false);
        await reload();
        return;
      }

      const id = createOfferLocal({
        dutyId,
        helperName: postingName,
        pitch: input.pitch,
        rewardAmount: input.rewardAmount,
      });
      if (!id) {
        alert("Could not send offer.");
        return;
      }
      const vid = getVisitorId();
      if (vid) {
        useProfileStore.getState().upsertLocalPublicProfile(vid, {
          displayName: postingName,
          chakra: useProfileStore.getState().getLocalPublicProfile(vid)?.chakra ?? 0,
        });
      }
      setOfferOpen(false);
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not send offer."));
    } finally {
      setBusy(false);
    }
  }

  async function handlePickOffer(offerId: string) {
    if (!dutyId) return;
    if (!window.confirm("Pick this helper for the duty?")) return;
    setBusy(true);
    try {
      if (remoteReady && supabase) {
        await pickDutyOfferRemote(supabase, dutyId, offerId);
        await reload();
        return;
      }
      pickOfferLocal(dutyId, offerId);
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not pick helper."));
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!dutyId) return;
    setBusy(true);
    try {
      if (remoteReady && supabase) {
        await completeDutyRemote(supabase, dutyId);
        await reload();
        return;
      }
      if (!viewerKey) {
        alert("Could not verify helper.");
        return;
      }
      completeLocal(dutyId, viewerKey);
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not mark complete."));
    } finally {
      setBusy(false);
    }
  }

  function awardLocalHelperChakra() {
    if (!duty) return;
    const assigned = duty.offers.find((offer) => offer.id === duty.assignedOfferId);
    if (!assigned?.helperVisitorId) return;
    useProfileStore
      .getState()
      .awardLocalChakra(
        assigned.helperVisitorId,
        chakraPointsForDuty(assigned.rewardAmount),
        assigned.helperName,
      );
  }

  async function handleReward() {
    if (!dutyId || !duty) return;
    const assigned = duty.offers.find((offer) => offer.id === duty.assignedOfferId);
    const amountLabel = assigned
      ? formatMoney(assigned.rewardAmount, assigned.currency)
      : "the agreed amount";

    if (
      !window.confirm(
        `Record ${amountLabel} reward in the app? You'll still pay the helper via UPI/cash.`,
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      if (remoteReady && supabase) {
        await rewardDutyRemote(supabase, dutyId);
        await reload();
        return;
      }
      if (!viewerKey) {
        alert("Could not verify author.");
        return;
      }
      rewardLocal(dutyId, viewerKey);
      awardLocalHelperChakra();
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not send reward."));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!dutyId || !duty) return;
    const message =
      duty.status === "rewarded"
        ? "Remove this duty from your list? The reward was already recorded."
        : duty.status === "completed"
          ? "Remove this duty? It will be deleted even though the helper marked it complete."
          : duty.status === "assigned"
            ? "Remove this duty? The assigned helper will no longer see it."
            : "Remove this duty? It will be deleted from the list.";
    if (!window.confirm(message)) return;
    setBusy(true);
    try {
      if (remoteReady && supabase) {
        await cancelDutyRemote(supabase, dutyId);
        router.replace("/duties");
        return;
      }
      if (!viewerKey) {
        alert("Could not verify author.");
        return;
      }
      cancelLocal(dutyId, viewerKey);
      router.replace("/duties");
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not remove duty."));
    } finally {
      setBusy(false);
    }
  }

  if (!dutyId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-subtle">Missing duty id.</p>
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
        <Link href="/duties" className="text-sm font-bold text-brand hover:underline">
          ← All duties
        </Link>
      </div>
    );
  }

  if (!duty) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16">
        <h1 className="text-xl font-bold text-foreground">Not found</h1>
        <Link href="/duties" className="text-sm font-bold text-brand hover:underline">
          ← All duties
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-6 sm:py-10">
      <Link href="/duties" className="text-sm font-semibold text-brand hover:underline">
        ← Duties
      </Link>

      <div className="mt-4">
        <DutyDetailPanel
          duty={duty}
          viewerKey={viewerKey}
          viewerUserId={currentUserId}
          busy={busy}
          onOffer={() => setOfferOpen(true)}
          onPickOffer={(offerId) => void handlePickOffer(offerId)}
          onComplete={() => void handleComplete()}
          onReward={() => void handleReward()}
          onCancel={() => void handleCancel()}
        />
      </div>

      {canUseDutyChat && duty && assignedOffer ? (
        <div className="mt-6">
          <DutyChatPanel
            dutyId={duty.id}
            supabase={supabase!}
            currentUserId={currentUserId!}
            authorUserId={duty.authorUserId!}
            authorName={duty.authorName}
            helperUserId={assignedOffer.helperUserId!}
            helperName={assignedOffer.helperName}
          />
        </div>
      ) : null}

      {!remoteReady ? (
        <div className="mt-6 space-y-1">
          <label className="text-xs font-semibold text-foreground" htmlFor="duty-helper-name">
            Your name on offers
          </label>
          <input
            id="duty-helper-name"
            value={helperName}
            onChange={(e) => setHelperName(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      ) : null}

      <DutyOfferModal
        open={offerOpen}
        disabled={busy}
        onClose={() => setOfferOpen(false)}
        onSubmit={(input) => void handleOffer(input)}
      />
    </div>
  );
}
