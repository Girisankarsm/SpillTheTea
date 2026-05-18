"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateRideModal } from "@/components/CreateRideModal";
import { RideCard } from "@/components/RideCard";
import { useSupabase } from "@/components/SupabaseProvider";
import { distanceKm } from "@/lib/geo";
import { unknownErrorMessage } from "@/lib/error-message";
import { setStoredRideRiderName } from "@/lib/ride-names";
import { createRideRemote, fetchRides } from "@/lib/supabase/ride-remote";
import { getCurrentUserId } from "@/lib/supabase/meet-greet-remote";
import type { RideWithOffers } from "@/lib/types/ride";
import { yellowButtonMdClass, yellowButtonSmClass } from "@/lib/ui";

const RidesMap = dynamic(
  () => import("@/components/RidesMap").then((m) => ({ default: m.RidesMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(50vh,360px)] min-h-[260px] items-center justify-center rounded-[1.25rem] border border-border bg-surface text-sm text-subtle">
        Loading map…
      </div>
    ),
  },
);

function isRideRider(ride: RideWithOffers, userId: string | null): boolean {
  return !!userId && ride.riderUserId === userId;
}

export default function RidesPage() {
  const router = useRouter();
  const { supabase, remoteReady } = useSupabase();

  const [rides, setRides] = useState<RideWithOffers[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const reload = useCallback(async () => {
    if (!supabase || !remoteReady) return;
    setLoading(true);
    try {
      setRides(await fetchRides(supabase));
      setCurrentUserId(await getCurrentUserId(supabase));
      setError(null);
    } catch (e) {
      setError(unknownErrorMessage(e, "Could not load ride requests."));
    } finally {
      setLoading(false);
    }
  }, [supabase, remoteReady]);

  useEffect(() => {
    queueMicrotask(() => void reload());
  }, [reload]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    if (!supabase || !remoteReady) return;
    const channel = supabase
      .channel("rides-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_requests" },
        () => void reload(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_offers" },
        () => void reload(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, remoteReady, reload]);

  const sortedRides = useMemo(() => {
    if (userLat == null || userLng == null) return rides;
    return [...rides].sort((a, b) => {
      const aHas = a.pickupLat != null && a.pickupLng != null;
      const bHas = b.pickupLat != null && b.pickupLng != null;
      if (!aHas && !bHas) return b.createdAt - a.createdAt;
      if (!aHas) return 1;
      if (!bHas) return -1;
      return (
        distanceKm(userLat, userLng, a.pickupLat!, a.pickupLng!) -
        distanceKm(userLat, userLng, b.pickupLat!, b.pickupLng!)
      );
    });
  }, [rides, userLat, userLng]);

  async function handleCreate(input: {
    riderName: string;
    pickupLabel: string;
    pickupLat?: number;
    pickupLng?: number;
    dropLabel: string;
    dropLat?: number;
    dropLng?: number;
    notes: string;
    maxReward?: number;
  }) {
    setStoredRideRiderName(input.riderName);
    setBusy(true);
    try {
      if (!remoteReady || !supabase) {
        alert("Sign in to request a ride.");
        return;
      }
      const ride = await createRideRemote(supabase, input);
      setCreateOpen(false);
      await reload();
      router.push(`/rides/${ride.id}`);
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not post ride request."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-10">
      <header className="space-y-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ride pooling
          </h1>
          <p className="text-sm leading-relaxed text-subtle">
            Need a drop? Post where you are and where you want to go. Someone
            heading the same way can offer to ride-share — you reward them in the
            app.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className={`${yellowButtonMdClass} w-full gap-1.5 sm:w-auto`}
        >
          <span className="text-lg leading-none" aria-hidden>
            +
          </span>
          Drop me
        </button>
        {remoteReady && loading ? (
          <p className="text-xs font-semibold text-brand">Refreshing…</p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-text">
            {error}
          </p>
        ) : null}
      </header>

      {remoteReady && sortedRides.length > 0 ? (
        <RidesMap rides={sortedRides} userLat={userLat} userLng={userLng} />
      ) : null}

      <ul className="flex flex-col gap-3">
        {sortedRides.map((ride) => {
          const dist =
            userLat != null &&
            userLng != null &&
            ride.pickupLat != null &&
            ride.pickupLng != null
              ? distanceKm(userLat, userLng, ride.pickupLat, ride.pickupLng)
              : undefined;
          return (
            <li key={ride.id}>
              <RideCard
                ride={ride}
                isRider={isRideRider(ride, currentUserId)}
                distanceKm={dist}
              />
            </li>
          );
        })}
      </ul>

      {sortedRides.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-5 py-8 text-center">
          <p className="text-sm text-subtle">No ride requests yet.</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className={`${yellowButtonSmClass} mt-4`}
          >
            Post the first one
          </button>
        </div>
      ) : null}

      <CreateRideModal
        open={createOpen}
        disabled={busy}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => void handleCreate(input)}
      />
    </div>
  );
}
