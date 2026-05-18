"use client";

import { useEffect, useRef, useState } from "react";
import { CreatePollModal } from "@/components/CreatePollModal";
import { PollCard } from "@/components/PollCard";
import { GifPicker } from "@/components/GifPicker";
import { buildRoomFeed } from "@/lib/feed";
import {
  buildMessageThread,
  countReplies,
  type ThreadNode,
} from "@/lib/message-thread";
import type { TopicSort } from "@/lib/message-upvotes";
import type { ChatMessage } from "@/lib/types";
import type { RoomPoll } from "@/lib/types/poll";

function formatChatTime(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(ms));
}

function MessageMedia({ message }: { message: ChatMessage }) {
  if (!message.mediaUrl) return null;

  const isGif = message.mediaType === "gif";

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-border bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={message.mediaUrl}
        alt={isGif ? "GIF attachment" : "Image attachment"}
        className="max-h-80 w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

function ThreadBranch({
  node,
  depth,
  messages,
  currentUserId,
  onReply,
  onPrivateChat,
  onUpvote,
  upvoteDisabled,
}: {
  node: ThreadNode;
  depth: number;
  messages: ChatMessage[];
  currentUserId?: string | null;
  onReply: (message: ChatMessage) => void;
  onPrivateChat?: (message: ChatMessage) => void;
  onUpvote?: (message: ChatMessage) => void;
  upvoteDisabled?: boolean;
}) {
  const { message, replies } = node;
  const replyCount = countReplies(messages, message.id);
  const indent = Math.min(depth, 4);
  const upvotes = message.upvoteCount ?? 0;

  return (
    <div className={indent > 0 ? "mt-2 border-l-2 border-brand/30 pl-3" : ""}>
      <article
        id={`msg-${message.id}`}
        className="flex gap-2 rounded-xl border border-border bg-surface px-3 py-3 sm:gap-3"
        style={indent > 0 ? { marginLeft: `${indent * 4}px` } : undefined}
      >
        {onUpvote ? (
          <button
            type="button"
            disabled={upvoteDisabled}
            onClick={() => onUpvote(message)}
            className={`flex shrink-0 flex-col items-center gap-0.5 rounded-md px-1.5 py-1 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              message.myUpvote
                ? "bg-brand text-white"
                : "text-subtle hover:bg-brand-soft hover:text-brand"
            }`}
            aria-pressed={message.myUpvote ?? false}
            aria-label={message.myUpvote ? "Remove upvote" : "Upvote"}
          >
            <span aria-hidden>▲</span>
            <span>{upvotes > 0 ? upvotes : ""}</span>
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-bold text-foreground">
                {message.authorName}
              </span>
              <time
                suppressHydrationWarning
                className="text-[11px] text-subtle"
                dateTime={new Date(message.createdAt).toISOString()}
              >
                {formatChatTime(message.createdAt)}
              </time>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {message.authorUserId &&
              message.authorUserId !== currentUserId &&
              onPrivateChat ? (
                <button
                  type="button"
                  onClick={() => onPrivateChat(message)}
                  className="text-xs font-bold text-subtle hover:text-brand hover:underline"
                >
                  Private
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onReply(message)}
                className="text-xs font-bold text-brand hover:underline"
              >
                Reply
                {replyCount > 0 ? ` · ${replyCount}` : ""}
              </button>
            </div>
          </header>

          {message.body.trim() ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {message.body}
            </p>
          ) : null}

          <MessageMedia message={message} />
        </div>
      </article>

      {replies.map((child) => (
        <ThreadBranch
          key={child.message.id}
          node={child}
          depth={depth + 1}
          messages={messages}
          currentUserId={currentUserId}
          onReply={onReply}
          onPrivateChat={onPrivateChat}
          onUpvote={onUpvote}
          upvoteDisabled={upvoteDisabled}
        />
      ))}
    </div>
  );
}

type ComposerProps = {
  name: string;
  nameLocked?: boolean;
  body: string;
  gifUrl: string;
  replyTo: ChatMessage | null;
  pendingFile: File | null;
  disabled?: boolean;
  pollDisabled?: boolean;
  onNameChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onGifUrlChange: (v: string) => void;
  onFilePick: (file: File | null) => void;
  onCancelReply: () => void;
  onOpenPoll: () => void;
  onSubmit: () => void;
};

function Composer({
  name,
  nameLocked = false,
  body,
  gifUrl,
  replyTo,
  pendingFile,
  disabled,
  pollDisabled,
  onNameChange,
  onBodyChange,
  onGifUrlChange,
  onFilePick,
  onCancelReply,
  onOpenPoll,
  onSubmit,
}: ComposerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFile) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  function handleFilePick(file: File | null) {
    if (file) onGifUrlChange("");
    onFilePick(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleGifSelect(url: string) {
    onFilePick(null);
    onGifUrlChange(url);
  }

  function clearMedia() {
    onGifUrlChange("");
    handleFilePick(null);
  }

  const hasMedia = Boolean(gifUrl || pendingFile);

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="sticky bottom-0 mt-auto space-y-2 border-t border-border bg-background py-4"
      >
        {replyTo ? (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-brand-soft px-3 py-2 text-xs">
            <span className="text-foreground">
              Replying to <strong>{replyTo.authorName}</strong>
            </span>
            <button
              type="button"
              onClick={onCancelReply}
              className="font-bold text-brand hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : null}

        <div className="space-y-1">
          <input
            value={name}
            onChange={(e) => {
              if (!nameLocked) onNameChange(e.target.value);
            }}
            placeholder="Anon name"
            autoComplete="off"
            readOnly={nameLocked}
            aria-readonly={nameLocked}
            className={`w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand sm:max-w-[200px] ${
              nameLocked ? "cursor-not-allowed opacity-80" : ""
            }`}
          />
          {nameLocked ? (
            <p className="text-[11px] text-subtle">Name locked for this room</p>
          ) : (
            <p className="text-[11px] text-subtle">
              Pick a name — it locks after your first post here
            </p>
          )}
        </div>

        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={replyTo ? "Write your reply…" : "Spill the tea or share a take…"}
          rows={3}
          autoComplete="off"
          className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />

        {hasMedia ? (
          <div className="relative overflow-hidden rounded-lg border border-border bg-surface p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={filePreview ?? gifUrl}
              alt="Attachment preview"
              className="max-h-40 w-full rounded-md object-contain"
            />
            <button
              type="button"
              onClick={clearMedia}
              className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white hover:bg-black/80"
            >
              Remove
            </button>
            <p className="mt-1 truncate text-[11px] text-subtle">
              {pendingFile
                ? pendingFile.name
                : gifUrl
                  ? "GIF selected"
                  : ""}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/*"
            className="hidden"
            onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => setGifPickerOpen(true)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground hover:bg-background"
          >
            Browse GIFs
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground hover:bg-background"
          >
            From device
          </button>
          <button
            type="button"
            onClick={onOpenPoll}
            disabled={pollDisabled || Boolean(replyTo)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            Poll
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="ml-auto rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {replyTo ? "Reply" : "Post"}
          </button>
        </div>
      </form>

      <GifPicker
        open={gifPickerOpen}
        onClose={() => setGifPickerOpen(false)}
        onSelect={handleGifSelect}
      />
    </>
  );
}

type MessageBoardProps = {
  messages: ChatMessage[];
  polls: RoomPoll[];
  name: string;
  nameLocked?: boolean;
  body: string;
  gifUrl: string;
  replyTo: ChatMessage | null;
  pendingFile: File | null;
  composerDisabled?: boolean;
  pollDisabled?: boolean;
  currentUserId?: string | null;
  onPrivateChat?: (message: ChatMessage) => void;
  onNameChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onGifUrlChange: (v: string) => void;
  onFilePick: (file: File | null) => void;
  onReply: (message: ChatMessage) => void;
  onCancelReply: () => void;
  onSubmit: () => void;
  onCreatePoll: (input: { question: string; options: string[] }) => void;
  onVotePoll: (pollId: string, optionId: string) => void;
  sort: TopicSort;
  onSortChange: (sort: TopicSort) => void;
  onUpvote?: (message: ChatMessage) => void;
  upvoteDisabled?: boolean;
};

export function MessageBoard({
  messages,
  polls,
  name,
  nameLocked,
  body,
  gifUrl,
  replyTo,
  pendingFile,
  composerDisabled,
  pollDisabled,
  currentUserId,
  onPrivateChat,
  onNameChange,
  onBodyChange,
  onGifUrlChange,
  onFilePick,
  onReply,
  onCancelReply,
  onSubmit,
  onCreatePoll,
  onVotePoll,
  sort,
  onSortChange,
  onUpvote,
  upvoteDisabled,
}: MessageBoardProps) {
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const feed = buildRoomFeed(messages, polls, sort);
  const thread = buildMessageThread(messages);
  const topLevelMessageIds = new Set(thread.map((node) => node.message.id));

  function sortButtonClass(active: boolean): string {
    return [
      "rounded-md px-2.5 py-1 text-xs font-bold transition",
      active
        ? "bg-brand text-white"
        : "text-subtle hover:bg-brand-soft hover:text-foreground",
    ].join(" ");
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
          Sort
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSortChange("hot")}
            className={sortButtonClass(sort === "hot")}
          >
            Hot
          </button>
          <button
            type="button"
            onClick={() => onSortChange("new")}
            className={sortButtonClass(sort === "new")}
          >
            New
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
        {feed.length === 0 ? (
          <p className="text-sm text-subtle">
            No posts yet — start the thread, drop a GIF, or start a poll.
          </p>
        ) : (
          feed.map((item) => {
            if (item.kind === "poll") {
              return (
                <PollCard
                  key={`poll-${item.poll.id}`}
                  poll={item.poll}
                  disabled={pollDisabled}
                  onVote={onVotePoll}
                />
              );
            }

            if (!topLevelMessageIds.has(item.message.id)) {
              return null;
            }

            const node = thread.find((entry) => entry.message.id === item.message.id);
            if (!node) return null;

            return (
              <ThreadBranch
                key={item.message.id}
                node={node}
                depth={0}
                messages={messages}
                currentUserId={currentUserId}
                onReply={onReply}
                onPrivateChat={onPrivateChat}
                onUpvote={onUpvote}
                upvoteDisabled={upvoteDisabled}
              />
            );
          })
        )}
      </div>

      <Composer
        name={name}
        nameLocked={nameLocked}
        body={body}
        gifUrl={gifUrl}
        replyTo={replyTo}
        pendingFile={pendingFile}
        disabled={composerDisabled}
        pollDisabled={pollDisabled}
        onNameChange={onNameChange}
        onBodyChange={onBodyChange}
        onGifUrlChange={onGifUrlChange}
        onFilePick={onFilePick}
        onCancelReply={onCancelReply}
        onOpenPoll={() => setPollModalOpen(true)}
        onSubmit={onSubmit}
      />

      <CreatePollModal
        open={pollModalOpen}
        disabled={pollDisabled}
        onClose={() => setPollModalOpen(false)}
        onSubmit={(input) => {
          onCreatePoll(input);
          setPollModalOpen(false);
        }}
      />
    </>
  );
}
