"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateDutyModal } from "@/components/CreateDutyModal";
import { DutyCard } from "@/components/DutyCard";
import { useSupabase } from "@/components/SupabaseProvider";
import { yellowButtonMdClass, yellowButtonSmClass } from "@/lib/ui";
import { unknownErrorMessage } from "@/lib/error-message";
import {
  setStoredDutyAuthorName,
} from "@/lib/duty-names";
import { createDutyRemote, fetchDuties } from "@/lib/supabase/duty-remote";
import { getCurrentUserId } from "@/lib/supabase/meet-greet-remote";
import { dutiesWithOffers, useMeetGreetStore } from "@/lib/store";
import type { DutyWithOffers } from "@/lib/types/duty";
import { getVisitorId } from "@/lib/visitor";

function isDutyAuthor(
  duty: DutyWithOffers,
  viewerUserId: string | null,
  viewerKey: string | null,
): boolean {
  if (viewerUserId && duty.authorUserId) return duty.authorUserId === viewerUserId;
  if (viewerKey && duty.authorVisitorId) return duty.authorVisitorId === viewerKey;
  return false;
}

export default function DutiesPage() {
  const router = useRouter();
  const { supabase, remoteReady } = useSupabase();

  const localDuties = useMeetGreetStore((s) => s.duties);
  const localOffers = useMeetGreetStore((s) => s.dutyOffers);
  const createDutyLocal = useMeetGreetStore((s) => s.createDuty);

  const [remoteDuties, setRemoteDuties] = useState<DutyWithOffers[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const localList = useMemo(
    () => dutiesWithOffers(localDuties, localOffers),
    [localDuties, localOffers],
  );

  const duties = remoteReady ? remoteDuties : localList;
  const viewerKey = getVisitorId();

  const reload = useCallback(async () => {
    if (!supabase || !remoteReady) return;
    setLoading(true);
    try {
      setRemoteDuties(await fetchDuties(supabase));
      setCurrentUserId(await getCurrentUserId());
      setError(null);
    } catch (e) {
      setError(unknownErrorMessage(e, "Could not load duties."));
    } finally {
      setLoading(false);
    }
  }, [supabase, remoteReady]);

  useEffect(() => {
    queueMicrotask(() => void reload());
  }, [reload]);

  useEffect(() => {
    if (!supabase || !remoteReady) return;
    const channel = supabase
      .channel("duties-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duties" },
        () => void reload(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duty_offers" },
        () => void reload(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, remoteReady, reload]);

  async function handleCreate(input: {
    title: string;
    description: string;
    authorName: string;
  }) {
    const postingName = input.authorName.trim() || "anon";
    setStoredDutyAuthorName(postingName);

    setBusy(true);
    try {
      if (remoteReady && supabase) {
        const userId = await getCurrentUserId();
        if (!userId) {
          alert("Sign in to post a duty.");
          return;
        }
        const duty = await createDutyRemote(supabase, {
          title: input.title,
          description: input.description,
          authorName: postingName,
        });
        setCreateOpen(false);
        await reload();
        router.push(`/duties/${duty.id}`);
        return;
      }

      const id = createDutyLocal({
        title: input.title,
        description: input.description,
        authorName: postingName,
      });
      if (!id) {
        alert("Could not post duty.");
        return;
      }
      setCreateOpen(false);
      router.push(`/duties/${id}`);
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not post duty."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-10">
      <header className="space-y-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Duties
          </h1>
          <p className="text-sm leading-relaxed text-subtle">
            Post small favors — &quot;can u pls…&quot; Helpers offer to do it and say what
            reward they want. You pick one, they complete it, you reward them in the app.
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
          Post duty
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

      {!remoteReady ? (
        <p className="text-xs text-subtle">
          Demo mode — duties save on this device. Sign in for MongoDB sync.
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {duties.map((duty) => (
          <li key={duty.id}>
            <DutyCard
              duty={duty}
              isAuthor={isDutyAuthor(duty, currentUserId, viewerKey)}
            />
          </li>
        ))}
      </ul>

      {duties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-5 py-8 text-center">
          <p className="text-sm text-subtle">No duties yet.</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className={`${yellowButtonSmClass} mt-4`}
          >
            Post the first one
          </button>
        </div>
      ) : null}

      <CreateDutyModal
        open={createOpen}
        disabled={busy}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => void handleCreate(input)}
      />
    </div>
  );
}
