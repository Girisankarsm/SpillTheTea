"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { truncatePreview } from "@/lib/tea-feed";
import type { TopicPreview } from "@/lib/tea-feed";
import type { Topic } from "@/lib/types";

type TeaFeedCardProps = {
  topic: Topic;
  messageCount: number;
  joinCount?: number;
  preview?: TopicPreview;
  deletable?: boolean;
  onClose?: () => void;
  onShare: () => void;
};

export function TeaFeedCard({
  topic,
  messageCount,
  joinCount = 0,
  preview,
  deletable,
  onClose,
  onShare,
}: TeaFeedCardProps) {
  const href = `/topics/${topic.id}`;
  const previewBody = preview?.body ? truncatePreview(preview.body) : "";

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex gap-2 px-3 pt-3 sm:gap-3 sm:px-4 sm:pt-4">
        <div
          className="flex w-8 shrink-0 flex-col items-center gap-0.5 pt-1 text-[11px] font-bold text-subtle"
          aria-hidden
        >
          <span aria-hidden>🔥</span>
          <span className="text-foreground">{messageCount > 0 ? messageCount : ""}</span>
        </div>

        <div className="min-w-0 flex-1 pb-3">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
            <span className="inline-flex items-center gap-1 font-bold text-foreground">
              <span aria-hidden>🍵</span>
              Tea
            </span>
            {preview?.authorName ? (
              <>
                <span aria-hidden>·</span>
                <span>u/{preview.authorName}</span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <time dateTime={new Date(topic.createdAt).toISOString()}>
              {formatRelativeTime(topic.createdAt)}
            </time>
            {joinCount > 0 ? (
              <>
                <span aria-hidden>·</span>
                <span>{joinCount} joined</span>
              </>
            ) : null}
            {deletable && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-md px-2 py-0.5 text-[11px] font-bold text-danger-text hover:bg-danger-bg"
              >
                Close
              </button>
            ) : null}
          </header>

          <Link href={href} className="mt-1 block">
            <h2 className="text-base font-semibold leading-snug text-foreground hover:underline sm:text-lg">
              {topic.title}
            </h2>
          </Link>

          {previewBody ? (
            <Link href={href} className="mt-2 block">
              <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-subtle hover:text-foreground">
                {previewBody}
              </p>
            </Link>
          ) : null}

          {preview?.mediaUrl ? (
            <Link href={href} className="mt-3 block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.mediaUrl}
                alt=""
                className="max-h-80 max-w-full rounded-lg"
                loading="lazy"
              />
            </Link>
          ) : null}
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-1 border-t border-border px-3 py-2 sm:px-4">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold text-subtle hover:bg-background hover:text-foreground"
        >
          <span aria-hidden>💬</span>
          {messageCount} {messageCount === 1 ? "Comment" : "Comments"}
        </Link>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold text-subtle hover:bg-background hover:text-foreground"
        >
          <span aria-hidden>↗</span>
          Share
        </button>
        <Link
          href={href}
          className="ml-auto inline-flex items-center rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
        >
          Open
        </Link>
      </footer>
    </article>
  );
}
