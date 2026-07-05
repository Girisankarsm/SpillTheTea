"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GifPicker } from "@/components/GifPicker";
import { VoiceCallButton } from "@/components/VoiceCallButton";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { appendUniqueMessage } from "@/lib/merge-messages";
import { unknownErrorMessage } from "@/lib/error-message";
import {
  chatMessagePreview,
  maybeShowLocalMessageNotification,
  notifyMessageRecipient,
} from "@/lib/push/client";
import { uploadRideAttachment, uploadRideVoice } from "@/lib/backend/ride-chat-media";
import {
  fetchRideMessages,
  mapRideChatRow,
  sendRideChatMessage,
} from "@/lib/backend/ride-chat-remote";
import { formatMoney } from "@/lib/types/ride";
import type { RideChatMessage } from "@/lib/types/ride-chat";
import type { BackendClient } from "@/lib/backend/client-types";

type RideChatPanelProps = {
  rideId: string;
  backend: BackendClient;
  currentUserId: string;
  riderUserId: string;
  riderName: string;
  driverUserId: string;
  driverName: string;
  driverRewardAmount?: number;
  driverCurrency?: string;
  driverPitch?: string;
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

function RideChatBubble({ message }: { message: RideChatMessage }) {
  const tone = message.isMine
    ? "ml-auto bg-brand text-white"
    : "bg-surface text-foreground";

  return (
    <div className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${tone}`}>
      <p className="mb-0.5 text-[10px] font-bold opacity-80">{message.senderName}</p>

      {message.messageType === "voice" && message.audioUrl ? (
        <audio controls preload="none" src={message.audioUrl} className="max-w-full" />
      ) : null}

      {(message.messageType === "image" || message.messageType === "gif") &&
      message.mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={message.mediaUrl}
          alt={message.messageType === "gif" ? "GIF attachment" : "Image attachment"}
          className="max-h-48 max-w-full rounded-lg object-contain"
        />
      ) : null}

      {message.messageType === "file" && message.mediaUrl ? (
        <a
          href={message.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${
            message.isMine
              ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
              : "border-border bg-background text-brand hover:underline"
          }`}
        >
          <span aria-hidden>📎</span>
          <span className="truncate">{message.fileName ?? "Download file"}</span>
        </a>
      ) : null}

      {message.body.trim() ? (
        <p className={`whitespace-pre-wrap ${message.mediaUrl || message.audioUrl ? "mt-2" : ""}`}>
          {message.body}
        </p>
      ) : null}

      <time className="mt-1 block text-[10px] opacity-70">
        {formatTime(message.createdAt)}
      </time>
    </div>
  );
}

export function RideChatPanel({
  rideId,
  backend,
  currentUserId,
  riderUserId,
  riderName,
  driverUserId,
  driverName,
  driverRewardAmount,
  driverCurrency = "INR",
  driverPitch,
}: RideChatPanelProps) {
  const [messages, setMessages] = useState<RideChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [gifUrl, setGifUrl] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const voice = useVoiceRecorder();

  const hasAttachment = Boolean(pendingFile || gifUrl);

  const chatContext = {
    currentUserId,
    riderUserId,
    riderName,
    driverUserId,
    driverName,
  };

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchRideMessages(
        backend,
        rideId,
        currentUserId,
        riderUserId,
        riderName,
        driverUserId,
        driverName,
      );
      setMessages(rows);
    } catch (e) {
      console.error(unknownErrorMessage(e, "Could not load messages."));
    } finally {
      setLoading(false);
    }
  }, [
    backend,
    rideId,
    currentUserId,
    riderUserId,
    riderName,
    driverUserId,
    driverName,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const channel = backend
      .channel(`ride-chat-${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ride_messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const mapped = mapRideChatRow(
            payload.new as Parameters<typeof mapRideChatRow>[0],
            currentUserId,
            riderUserId,
            riderName,
            driverUserId,
            driverName,
          );
          setMessages((prev) => appendUniqueMessage(prev, mapped));
          if (mapped.senderId !== currentUserId) {
            maybeShowLocalMessageNotification({
              title: `${mapped.senderName} (ride chat)`,
              body: chatMessagePreview(mapped.body, mapped.messageType),
              url: `/rides/${rideId}`,
              senderId: mapped.senderId,
              currentUserId,
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          void reload();
        }
      });

    return () => {
      void backend.removeChannel(channel);
    };
  }, [
    backend,
    rideId,
    currentUserId,
    riderUserId,
    riderName,
    driverUserId,
    driverName,
    reload,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!pendingFile) {
      setFilePreview(null);
      return;
    }
    if (!pendingFile.type.startsWith("image/")) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  function clearAttachment() {
    setPendingFile(null);
    setGifUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFilePick(file: File | null) {
    if (!file) return;
    setGifUrl("");
    setPendingFile(file);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (sending || voice.recording) return;

    const caption = draft.trim();
    if (!caption && !hasAttachment) return;

    setSending(true);
    try {
      if (pendingFile) {
        const uploaded = await uploadRideAttachment(backend, rideId, pendingFile);
        const sent = await sendRideChatMessage(
          backend,
          rideId,
          {
            messageType: uploaded.messageType,
            mediaUrl: uploaded.url,
            fileName: uploaded.messageType === "file" ? uploaded.fileName : undefined,
            body: caption,
          },
          chatContext,
        );
        setMessages((prev) => appendUniqueMessage(prev, sent));
        void notifyMessageRecipient({ kind: "ride_chat", messageId: sent.id });
        clearAttachment();
        setDraft("");
        return;
      }

      if (gifUrl) {
        const sent = await sendRideChatMessage(
          backend,
          rideId,
          {
            messageType: "gif",
            mediaUrl: gifUrl,
            body: caption,
          },
          chatContext,
        );
        setMessages((prev) => appendUniqueMessage(prev, sent));
        void notifyMessageRecipient({ kind: "ride_chat", messageId: sent.id });
        clearAttachment();
        setDraft("");
        return;
      }

      const sent = await sendRideChatMessage(
        backend,
        rideId,
        {
          messageType: "text",
          body: caption,
        },
        chatContext,
      );
      setMessages((prev) => appendUniqueMessage(prev, sent));
      void notifyMessageRecipient({ kind: "ride_chat", messageId: sent.id });
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
        const audioUrl = await uploadRideVoice(backend, rideId, blob);
        const sent = await sendRideChatMessage(
          backend,
          rideId,
          {
            messageType: "voice",
            audioUrl,
          },
          chatContext,
        );
        setMessages((prev) => appendUniqueMessage(prev, sent));
        void notifyMessageRecipient({ kind: "ride_chat", messageId: sent.id });
      } catch (err) {
        alert(unknownErrorMessage(err, "Could not send voice message."));
      } finally {
        setSending(false);
      }
      return;
    }

    await voice.start();
  }

  const canSend = Boolean(draft.trim() || hasAttachment);
  const peerUserId = currentUserId === riderUserId ? driverUserId : riderUserId;
  const peerName = currentUserId === riderUserId ? driverName : riderName;
  const callerName = currentUserId === riderUserId ? riderName : driverName;

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-foreground">Private chat</h2>
          <p className="mt-1 text-xs text-subtle">
            Only {riderName} and {driverName} can see this — posting names, not
            profile names.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {peerUserId ? (
            <VoiceCallButton
              roomId={`ride:${rideId}`}
              roomLabel="Ride chat"
              peerUserId={peerUserId}
              peerName={peerName}
              callerName={callerName}
            />
          ) : null}
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
            Private
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <PersonChip
          name={riderName}
          role="Rider"
          active={currentUserId === riderUserId}
        />
        <PersonChip
          name={driverName}
          role="Driver"
          active={currentUserId === driverUserId}
        />
      </div>

      {driverRewardAmount != null ? (
        <p className="mt-2 text-xs text-subtle">
          Agreed reward: {formatMoney(driverRewardAmount, driverCurrency)}
          {driverPitch ? ` · “${driverPitch}”` : ""}
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
            <RideChatBubble key={message.id} message={message} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {voice.error ? (
        <p className="mt-2 text-xs text-danger-text">{voice.error}</p>
      ) : null}

      <form onSubmit={(e) => void handleSend(e)} className="mt-3 space-y-2">
        {hasAttachment ? (
          <div className="relative overflow-hidden rounded-lg border border-border bg-background p-2">
            {filePreview || gifUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={filePreview ?? gifUrl}
                alt="Attachment preview"
                className="max-h-36 w-full rounded-md object-contain"
              />
            ) : pendingFile ? (
              <p className="rounded-md bg-surface px-3 py-4 text-center text-sm text-subtle">
                📎 {pendingFile.name}
              </p>
            ) : null}
            <button
              type="button"
              onClick={clearAttachment}
              className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white hover:bg-black/80"
            >
              Remove
            </button>
          </div>
        ) : null}

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            hasAttachment ? "Add a caption (optional)…" : "Private message…"
          }
          maxLength={2000}
          disabled={voice.recording}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
        />

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/heic,application/pdf,.pdf,.doc,.docx,.txt,.zip"
            className="hidden"
            onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => setGifPickerOpen(true)}
            disabled={sending || voice.recording}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:bg-surface disabled:opacity-50"
          >
            GIF
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={sending || voice.recording}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:bg-surface disabled:opacity-50"
          >
            Attach
          </button>
          {voice.supported ? (
            <button
              type="button"
              onClick={() => void handleVoiceToggle()}
              disabled={sending}
              title={voice.recording ? "Stop and send voice note" : "Record voice note"}
              aria-label={voice.recording ? "Stop recording" : "Record voice note"}
              className={`rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 ${
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
            disabled={sending || !canSend || voice.recording}
            className="ml-auto rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>

      <GifPicker
        open={gifPickerOpen}
        onClose={() => setGifPickerOpen(false)}
        onSelect={(url) => {
          setPendingFile(null);
          if (fileRef.current) fileRef.current.value = "";
          setGifUrl(url);
          setGifPickerOpen(false);
        }}
      />
    </section>
  );
}
