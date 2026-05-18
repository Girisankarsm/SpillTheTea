"use client";

import type { RoomPoll } from "@/lib/types/poll";

function formatChatTime(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(ms));
}

type PollCardProps = {
  poll: RoomPoll;
  disabled?: boolean;
  onVote: (pollId: string, optionId: string) => void;
};

export function PollCard({ poll, disabled, onVote }: PollCardProps) {
  const totalVotes = poll.options.reduce((sum, option) => sum + option.voteCount, 0);
  const hasVoted = Boolean(poll.myVoteOptionId);

  return (
    <article className="rounded-xl border border-border bg-surface px-4 py-3">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-bold text-foreground">{poll.authorName}</span>
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
            Poll
          </span>
          <time
            suppressHydrationWarning
            className="text-[11px] text-subtle"
            dateTime={new Date(poll.createdAt).toISOString()}
          >
            {formatChatTime(poll.createdAt)}
          </time>
        </div>
        <span className="text-[11px] text-subtle">
          {totalVotes} vote{totalVotes === 1 ? "" : "s"}
        </span>
      </header>

      <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">
        {poll.question}
      </p>

      <div className="mt-3 space-y-2">
        {poll.options.map((option) => {
          const pct =
            totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          const selected = poll.myVoteOptionId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onVote(poll.id, option.id)}
              className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-brand bg-brand-soft"
                  : "border-border bg-background hover:border-brand/50 hover:bg-brand-soft/40"
              }`}
            >
              {hasVoted ? (
                <span
                  className="absolute inset-y-0 left-0 bg-brand/15"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              ) : null}
              <span className="relative flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">{option.label}</span>
                {hasVoted ? (
                  <span className="shrink-0 text-xs font-bold text-subtle">
                    {pct}% · {option.voteCount}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {!hasVoted ? (
        <p className="mt-2 text-[11px] text-subtle">Tap an option to vote.</p>
      ) : (
        <p className="mt-2 text-[11px] text-subtle">Tap another option to change your vote.</p>
      )}
    </article>
  );
}
