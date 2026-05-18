"use client";

const TITLE_MAX = 300;
const BODY_MAX = 4000;

type CreateTopicPanelProps = {
  title: string;
  body: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitting?: boolean;
};

const tabs = [
  { id: "text", label: "Text", active: true },
  { id: "media", label: "Images & Video", active: false },
  { id: "link", label: "Link", active: false },
  { id: "poll", label: "Poll", active: false },
] as const;

export function CreateTopicPanel({
  title,
  body,
  onTitleChange,
  onBodyChange,
  onSubmit,
  disabled = false,
  submitting = false,
}: CreateTopicPanelProps) {
  const titleValid = title.trim().length > 0;
  const canPost = titleValid && !disabled && !submitting;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canPost) onSubmit();
      }}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-lg font-bold text-foreground">Create post</h2>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground">
          <span aria-hidden>🍵</span>
          Tea
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto border-b border-border px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={!tab.active}
            className={[
              "shrink-0 border-b-2 py-3 text-sm font-bold transition",
              tab.active
                ? "border-brand text-foreground"
                : "cursor-not-allowed border-transparent text-subtle opacity-50",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-4">
        <div className="relative">
          <label className="pointer-events-none absolute left-3 top-2 text-[11px] font-semibold text-subtle">
            Title<span className="text-danger-text">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value.slice(0, TITLE_MAX))}
            placeholder=""
            disabled={disabled}
            className="w-full rounded-2xl border border-border bg-background px-3 pb-3 pt-7 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          />
          <div className="mt-1 flex items-center justify-end gap-2">
            {titleValid ? (
              <span className="text-xs text-brand" aria-hidden>
                ✓
              </span>
            ) : null}
            <span className="text-[11px] text-subtle">
              {title.length}/{TITLE_MAX}
            </span>
          </div>
        </div>

        <div>
          <textarea
            value={body}
            onChange={(e) => onBodyChange(e.target.value.slice(0, BODY_MAX))}
            placeholder="Body text (optional)"
            rows={6}
            disabled={disabled}
            className="w-full resize-y rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none placeholder:text-subtle focus:ring-2 focus:ring-brand disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-border px-4 py-3">
        <button
          type="submit"
          disabled={!canPost}
          className="rounded-full bg-brand px-6 py-2 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
