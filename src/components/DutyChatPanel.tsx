"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
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
import { uploadDutyAttachment, uploadDutyVoice } from "@/lib/supabase/duty-chat-media";
import {
  fetchDutyMessages,
  mapDutyChatRow,
  sendDutyChatMessage,
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

function DutyChatBubble({ message }: { message: DutyChatMessage }) {
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
    authorUserId,
    authorName,
    helperUserId,
    helperName,
  };

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
          const mapped = mapDutyChatRow(
            payload.new as Parameters<typeof mapDutyChatRow>[0],
            currentUserId,
            authorUserId,
            authorName,
            helperUserId,
            helperName,
          );
          setMessages((prev) => appendUniqueMessage(prev, mapped));
          if (mapped.senderId !== currentUserId) {
            maybeShowLocalMessageNotification({
              title: `${mapped.senderName} (duty chat)`,
              body: chatMessagePreview(mapped.body, mapped.messageType),
              url: `/duties/${dutyId}`,
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
        const uploaded = await uploadDutyAttachment(supabase, dutyId, pendingFile);
        const sent = await sendDutyChatMessage(
          supabase,
          dutyId,
          {
            messageType: uploaded.messageType,
            mediaUrl: uploaded.url,
            fileName: uploaded.messageType === "file" ? uploaded.fileName : undefined,
            body: caption,
          },
          chatContext,
        );
        setMessages((prev) => appendUniqueMessage(prev, sent));
        void notifyMessageRecipient({ kind: "duty_chat", messageId: sent.id });
        clearAttachment();
        setDraft("");
        return;
      }

      if (gifUrl) {
        const sent = await sendDutyChatMessage(
          supabase,
          dutyId,
          {
            messageType: "gif",
            mediaUrl: gifUrl,
            body: caption,
          },
          chatContext,
        );
        setMessages((prev) => appendUniqueMessage(prev, sent));
        void notifyMessageRecipient({ kind: "duty_chat", messageId: sent.id });
        clearAttachment();
        setDraft("");
        return;
      }

      const sent = await sendDutyChatMessage(
        supabase,
        dutyId,
        {
          messageType: "text",
          body: caption,
        },
        chatContext,
      );
      setMessages((prev) => appendUniqueMessage(prev, sent));
      void notifyMessageRecipient({ kind: "duty_chat", messageId: sent.id });
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
        const sent = await sendDutyChatMessage(
          supabase,
          dutyId,
          {
            messageType: "voice",
            audioUrl,
          },
          chatContext,
        );
        setMessages((prev) => appendUniqueMessage(prev, sent));
        void notifyMessageRecipient({ kind: "duty_chat", messageId: sent.id });
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
  const peerUserId = currentUserId === authorUserId ? helperUserId : authorUserId;
  const peerName = currentUserId === authorUserId ? helperName : authorName;
  const callerName = currentUserId === authorUserId ? authorName : helperName;

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
        <div className="flex flex-wrap items-center gap-2">
          {peerUserId ? (
            <VoiceCallButton
              roomId={`duty:${dutyId}`}
              roomLabel="Duty chat"
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
            <DutyChatBubble key={message.id} message={message} />
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
