"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DmMessage, DmRequest, DmThread } from "@/lib/types/dm";
import {
  acceptDmRequest,
  fetchDmMessages,
  fetchDmRequests,
  fetchDmThreads,
  rejectDmRequest,
  sendDmMessage,
  sendDmRequest,
} from "@/lib/backend/dm-remote";
import { appendUniqueMessage } from "@/lib/merge-messages";
import { unknownErrorMessage } from "@/lib/error-message";
import {
  chatMessagePreview,
  maybeShowLocalMessageNotification,
  notifyMessageRecipient,
} from "@/lib/push/client";
import { VoiceCallButton } from "@/components/VoiceCallButton";

type BackendChannel = {
  on: (
    type: string,
    filter: unknown,
    callback?: (event: { payload?: unknown }) => void,
  ) => BackendChannel;
  subscribe: (callback?: (status: string) => void) => BackendChannel | Promise<BackendChannel>;
};

type BackendClient = {
  channel: (name: string) => BackendChannel;
  removeChannel: (channel: BackendChannel) => Promise<void>;
};

type PrivateChatPanelProps = {
  open: boolean;
  onClose: () => void;
  backend: BackendClient;
  topicId: string;
  currentUserId: string;
  initialThreadId?: string | null;
  initialRequestUserId?: string | null;
  initialRequestDisplayName?: string;
  onDataChange?: () => void;
};

function formatTime(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function PrivateChatPanel({
  open,
  onClose,
  backend,
  topicId,
  currentUserId,
  initialThreadId,
  initialRequestUserId,
  initialRequestDisplayName,
  onDataChange,
}: PrivateChatPanelProps) {
  const [requests, setRequests] = useState<DmRequest[]>([]);
  const [threads, setThreads] = useState<DmThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const requestSentRef = useRef(false);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  const incoming = requests.filter(
    (r) => r.status === "pending" && r.toUserId === currentUserId,
  );

  const reload = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const [reqs, ths] = await Promise.all([
        fetchDmRequests(backend, topicId, currentUserId),
        fetchDmThreads(backend, topicId, currentUserId),
      ]);
      setRequests(reqs);
      setThreads(ths);
      onDataChange?.();
    } catch (e) {
      console.error(unknownErrorMessage(e, "Could not load private chats."));
    } finally {
      setLoading(false);
    }
  }, [open, backend, topicId, currentUserId, onDataChange]);

  useEffect(() => {
    if (!open) return;
    void reload();
  }, [open, reload]);

  useEffect(() => {
    if (!open) {
      setActiveThreadId(null);
      setMessages([]);
      setDraft("");
      requestSentRef.current = false;
      return;
    }
    if (initialThreadId) setActiveThreadId(initialThreadId);
  }, [open, initialThreadId]);

  useEffect(() => {
    if (!open || !initialRequestUserId || initialThreadId || requestSentRef.current) {
      return;
    }
    requestSentRef.current = true;
    void (async () => {
      try {
        await sendDmRequest(backend, topicId, initialRequestUserId);
        await reload();
        alert(`Request sent to ${initialRequestDisplayName ?? "them"}.`);
      } catch (e) {
        alert(unknownErrorMessage(e, "Could not send request."));
      }
    })();
  }, [
    open,
    initialRequestUserId,
    initialThreadId,
    initialRequestDisplayName,
    backend,
    topicId,
    reload,
  ]);

  useEffect(() => {
    if (!open || !activeThreadId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const msgs = await fetchDmMessages(
          backend,
          activeThreadId,
          currentUserId,
        );
        if (!cancelled) setMessages(msgs);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();

    const channel = backend
      .channel(`dm-${activeThreadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `thread_id=eq.${activeThreadId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            thread_id: string;
            sender_id: string;
            body: string;
            created_at: string;
          };
          const mapped: DmMessage = {
            id: row.id,
            threadId: row.thread_id,
            senderId: row.sender_id,
            body: row.body,
            createdAt: new Date(row.created_at).getTime(),
            isMine: row.sender_id === currentUserId,
          };
          setMessages((prev) => appendUniqueMessage(prev, mapped));
          if (mapped.senderId !== currentUserId) {
            maybeShowLocalMessageNotification({
              title: `${activeThread?.otherDisplayName ?? "Someone"} (private chat)`,
              body: chatMessagePreview(mapped.body),
              url: `/topics/${topicId}`,
              senderId: mapped.senderId,
              currentUserId,
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          void fetchDmMessages(backend, activeThreadId, currentUserId).then(
            (msgs) => setMessages(msgs),
            () => undefined,
          );
        }
      });

    return () => {
      cancelled = true;
      void backend.removeChannel(channel);
    };
  }, [open, activeThreadId, backend, currentUserId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeThreadId]);

  async function handleAccept(requestId: string) {
    try {
      const threadId = await acceptDmRequest(backend, requestId);
      await reload();
      setActiveThreadId(threadId);
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not accept request."));
    }
  }

  async function handleReject(requestId: string) {
    try {
      await rejectDmRequest(backend, requestId);
      await reload();
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not decline request."));
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThreadId || sending) return;
    setSending(true);
    try {
      const sent = await sendDmMessage(backend, activeThreadId, draft, currentUserId);
      setMessages((prev) => appendUniqueMessage(prev, sent));
      void notifyMessageRecipient({ kind: "dm", messageId: sent.id });
      setDraft("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[650] flex justify-end bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Private chats"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Private chats</h2>
            <p className="text-[11px] text-subtle">Request → they accept → DM</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-bold text-subtle hover:bg-background"
          >
            Close
          </button>
        </header>

        {loading ? (
          <p className="px-4 py-6 text-sm text-subtle">Loading…</p>
        ) : activeThread ? (
          <>
            <div className="border-b border-border px-4 py-2">
              <button
                type="button"
                onClick={() => setActiveThreadId(null)}
                className="text-xs font-bold text-brand hover:underline"
              >
                ← All chats
              </button>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-foreground">
                  {activeThread.otherDisplayName}
                </p>
                <VoiceCallButton
                  roomId={`dm:${activeThread.id}`}
                  roomLabel="Private chat"
                  peerUserId={activeThread.otherUserId}
                  peerName={activeThread.otherDisplayName}
                  callerName="Guest"
                />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
              {messages.length === 0 ? (
                <p className="text-sm text-subtle">Say hi — this is private.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      m.isMine
                        ? "ml-auto bg-brand text-white"
                        : "bg-background text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <time className="mt-1 block text-[10px] opacity-70">
                      {formatTime(m.createdAt)}
                    </time>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
            <form
              onSubmit={(e) => void handleSend(e)}
              className="flex gap-2 border-t border-border p-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Private message…"
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {incoming.length > 0 ? (
              <section className="mb-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-subtle">
                  Requests for you
                </h3>
                {incoming.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-border bg-background p-3"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {r.fromDisplayName}
                    </p>
                    <p className="mt-0.5 text-xs text-subtle">
                      Wants to chat privately
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleAccept(r.id)}
                        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReject(r.id)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-subtle">
                Active private chats
              </h3>
              {threads.length === 0 ? (
                <p className="text-sm text-subtle">
                  No private chats yet. Tap Private on someone&apos;s post to
                  request one.
                </p>
              ) : (
                threads.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveThreadId(t.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-3 text-left hover:bg-brand-soft"
                  >
                    <span className="text-sm font-bold text-foreground">
                      {t.otherDisplayName}
                    </span>
                    <span className="text-xs text-brand">Open →</span>
                  </button>
                ))
              )}
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
