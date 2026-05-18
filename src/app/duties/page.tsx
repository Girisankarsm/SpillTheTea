"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateDutyModal } from "@/components/CreateDutyModal";
import { DutyCard } from "@/components/DutyCard";
import { useSupabase } from "@/components/SupabaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { unknownErrorMessage } from "@/lib/error-message";
import { createDutyRemote, fetchDuties } from "@/lib/supabase/duty-remote";
import { getCurrentUserId } from "@/lib/supabase/meet-greet-remote";
import { dutiesWithOffers, useMeetGreetStore } from "@/lib/store";
import type { DutyWithOffers } from "@/lib/types/duty";
import { getVisitorId } from "@/lib/visitor";

export default function DutiesPage() {
  const router = useRouter();
  const { supabase, remoteReady } = useSupabase();
  const { defaultDisplayName } = useUserProfile();

  const localDuties = useMeetGreetStore((s) => s.duties);
  const localOffers = useMeetGreetStore((s) => s.dutyOffers);
  const createDutyLocal = useMeetGreetStore((s) => s.createDuty);

  const [remoteDuties, setRemoteDuties] = useState<DutyWithOffers[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authorName, setAuthorName] = useState("Guest");
  const [authorNameEdited, setAuthorNameEdited] = useState(false);

  const localList = useMemo(
    () => dutiesWithOffers(localDuties, localOffers),
    [localDuties, localOffers],
  );

  const duties = remoteReady ? remoteDuties : localList;

  const reload = useCallback(async () => {
    if (!supabase || !remoteReady) return;
    setLoading(true);
    try {
      setRemoteDuties(await fetchDuties(supabase));
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

  useEffect(() => {
    if (!authorNameEdited && defaultDisplayName) setAuthorName(defaultDisplayName);
  }, [defaultDisplayName, authorNameEdited]);

  async function handleCreate(input: { title: string; description: string }) {
    setBusy(true);
    try {
      if (remoteReady && supabase) {
        const userId = await getCurrentUserId(supabase);
        if (!userId) {
          alert("Sign in to post a duty.");
          return;
        }
        const duty = await createDutyRemote(supabase, {
          title: input.title,
          description: input.description,
          authorName,
        });
        setCreateOpen(false);
        await reload();
        router.push(`/duties/${duty.id}`);
        return;
      }

      const id = createDutyLocal({
        title: input.title,
        description: input.description,
        authorName,
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Duties</h1>
            <p className="max-w-xl text-sm leading-relaxed text-subtle">
              Post small favors — &quot;can u pls…&quot; Helpers offer to do it and say what
              reward they want. You pick one, they complete it, you reward them in the app.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            <span className="text-lg leading-none" aria-hidden>
              +
            </span>
            Post duty
          </button>
        </div>
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
          Demo mode — duties save on this device. Sign in with Supabase for live sync.
        </p>
      ) : null}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-foreground" htmlFor="duty-author-name">
          Your name on duties
        </label>
        <input
          id="duty-author-name"
          value={authorName}
          onChange={(e) => {
            setAuthorNameEdited(true);
            setAuthorName(e.target.value);
          }}
          className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <ul className="flex flex-col gap-3">
        {duties.map((duty) => (
          <li key={duty.id}>
            <DutyCard duty={duty} />
          </li>
        ))}
      </ul>

      {duties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-5 py-8 text-center">
          <p className="text-sm text-subtle">No duties yet.</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            Post the first one
          </button>
        </div>
      ) : null}

      <CreateDutyModal
        open={createOpen}
        disabled={busy}
        authorName={authorName}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => void handleCreate(input)}
      />
    </div>
  );
}
