"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { unknownErrorMessage } from "@/lib/error-message";
import {
  fetchDutyMessages,
  sendDutyMessage,
} from "@/lib/supabase/duty-chat-remote";
import type { DutyChatMessage } from "@/lib/types/duty-chat";

type DutyChatPanelProps = {
  dutyId: string;
  supabase: SupabaseClient;
  currentUserId: string;
  authorUserId: string;
  authorName: string;
  helperUserId: string;
  helperName: string;
};

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DutyChatPanel({
  dutyId,
  supabase,
  currentUserId,
  authorUserId,
  authorName,
  helperUserId,
  helperName,
}: DutyChatPanelProps) {
  const [messages, setMessages] = useState<DutyChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

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
            created_at: string;
          };
          const mapped: DutyChatMessage = {
            id: row.id,
            dutyId: row.duty_id,
            senderId: row.sender_id,
            senderName:
              row.sender_id === authorUserId ? authorName : helperName,
            body: row.body,
            createdAt: new Date(row.created_at).getTime(),
            isMine: row.sender_id === currentUserId,
          };
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

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-bold text-foreground">Messages</h2>
      <p className="mt-1 text-xs text-subtle">
        Chat with {currentUserId === authorUserId ? helperName : authorName} about
        this duty.
      </p>

      <div className="mt-4 flex max-h-72 flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-background px-3 py-3">
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
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                message.isMine
                  ? "ml-auto bg-brand text-white"
                  : "bg-surface text-foreground"
              }`}
            >
              {!message.isMine ? (
                <p className="mb-0.5 text-[10px] font-bold opacity-80">
                  {message.senderName}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap">{message.body}</p>
              <time className="mt-1 block text-[10px] opacity-70">
                {formatTime(message.createdAt)}
              </time>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={(e) => void handleSend(e)} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          maxLength={2000}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
