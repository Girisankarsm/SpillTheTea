"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { unknownErrorMessage } from "@/lib/error-message";
import { uploadDutyVoice } from "@/lib/supabase/duty-chat-media";
import {
  fetchDutyMessages,
  mapDutyChatRow,
  sendDutyMessage,
  sendDutyVoiceMessage,
} from "@/lib/supabase/duty-chat-remote";
import { formatMoney } from "@/lib/types/duty";
import type { DutyChatMessage } from "@/lib/types/duty-chat";

type DutyChatPanelProps = {
  dutyId: string;
  supabase: SupabaseClient;
  currentUserId: string;
  authorUserId: string;
  authorName: string;
  helperUserId: string;
  helperName: string;
  helperRewardAmount?: number;
  helperCurrency?: string;
  helperPitch?: string;
};

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function PersonChip({
  name,
  role,
  active,
}: {
  name: string;
  role: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
        active ? "border-brand bg-brand-soft" : "border-border bg-background"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          active ? "bg-brand text-white" : "bg-surface text-brand"
        }`}
        aria-hidden
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{name}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
          {role}
        </p>
      </div>
    </div>
  );
}

export function DutyChatPanel({
  dutyId,
  supabase,
  currentUserId,
  authorUserId,
  authorName,
  helperUserId,
  helperName,
  helperRewardAmount,
  helperCurrency = "INR",
  helperPitch,
}: DutyChatPanelProps) {
  const [messages, setMessages] = useState<DutyChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const voice = useVoiceRecorder();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchDutyMessages(
        supabase,
        dutyId,
        currentUserId,
        authorUserId,
        authorName,
        helperUserId,
        helperName,
      );
      setMessages(rows);
    } catch (e) {
      console.error(unknownErrorMessage(e, "Could not load messages."));
    } finally {
      setLoading(false);
    }
  }, [
    supabase,
    dutyId,
    currentUserId,
    authorUserId,
    authorName,
    helperUserId,
    helperName,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const channel = supabase
      .channel(`duty-chat-${dutyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "duty_messages",
          filter: `duty_id=eq.${dutyId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            duty_id: string;
            sender_id: string;
            body: string;
            message_type?: "text" | "voice";
            audio_url?: string | null;
            created_at: string;
          };
          const mapped = mapDutyChatRow(
            row,
            currentUserId,
            authorUserId,
            authorName,
            helperUserId,
            helperName,
          );
          setMessages((prev) => {
            if (prev.some((entry) => entry.id === mapped.id)) return prev;
            return [...prev, mapped];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    supabase,
    dutyId,
    currentUserId,
    authorUserId,
    authorName,
    helperUserId,
    helperName,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (sending || !draft.trim()) return;
    setSending(true);
    try {
      await sendDutyMessage(supabase, dutyId, draft);
      setDraft("");
    } catch (err) {
      alert(unknownErrorMessage(err, "Could not send message."));
    } finally {
      setSending(false);
    }
  }

  async function handleVoiceToggle() {
    if (sending) return;

    if (voice.recording) {
      setSending(true);
      try {
        const blob = await voice.stop();
        if (!blob || blob.size === 0) {
          alert("Recording was too short.");
          return;
        }
        const audioUrl = await uploadDutyVoice(supabase, dutyId, blob);
        await sendDutyVoiceMessage(supabase, dutyId, audioUrl);
      } catch (err) {
        alert(unknownErrorMessage(err, "Could not send voice message."));
      } finally {
        setSending(false);
      }
      return;
    }

    await voice.start();
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-foreground">Private chat</h2>
          <p className="mt-1 text-xs text-subtle">
            Only {authorName} and {helperName} can see this — posting names, not
            profile names.
          </p>
        </div>
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          Private
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <PersonChip
          name={authorName}
          role="Author"
          active={currentUserId === authorUserId}
        />
        <PersonChip
          name={helperName}
          role="Helper"
          active={currentUserId === helperUserId}
        />
      </div>

      {helperRewardAmount != null ? (
        <p className="mt-2 text-xs text-subtle">
          Agreed reward: {formatMoney(helperRewardAmount, helperCurrency)}
          {helperPitch ? ` · “${helperPitch}”` : ""}
        </p>
      ) : null}

      <div className="mt-4 flex max-h-72 flex-col gap-2 overflow-y-auto rounded-xl border border-border bg-background px-3 py-3">
        {loading ? (
          <p className="text-sm text-subtle">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-subtle">
            No messages yet — say hi to coordinate.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${
                message.isMine
                  ? "ml-auto bg-brand text-white"
                  : "bg-surface text-foreground"
              }`}
            >
              <p className="mb-0.5 text-[10px] font-bold opacity-80">
                {message.senderName}
              </p>
              {message.messageType === "voice" && message.audioUrl ? (
                <audio
                  controls
                  preload="none"
                  src={message.audioUrl}
                  className="max-w-full"
                />
              ) : (
                <p className="whitespace-pre-wrap">{message.body}</p>
              )}
              <time className="mt-1 block text-[10px] opacity-70">
                {formatTime(message.createdAt)}
              </time>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {voice.error ? (
        <p className="mt-2 text-xs text-danger-text">{voice.error}</p>
      ) : null}

      <form onSubmit={(e) => void handleSend(e)} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Private message…"
          maxLength={2000}
          disabled={voice.recording}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
        />
        {voice.supported ? (
          <button
            type="button"
            onClick={() => void handleVoiceToggle()}
            disabled={sending}
            title={voice.recording ? "Stop and send voice note" : "Record voice note"}
            aria-label={voice.recording ? "Stop recording" : "Record voice note"}
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50 ${
              voice.recording
                ? "animate-pulse border-danger-border bg-danger-bg text-danger-text"
                : "border-border bg-background text-foreground hover:bg-surface"
            }`}
          >
            {voice.recording ? "Stop" : "Voice"}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={sending || !draft.trim() || voice.recording}
          className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
