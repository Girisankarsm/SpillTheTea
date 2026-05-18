"use client";

import { useEffect, useState } from "react";

type CreateDutyModalProps = {
  open: boolean;
  disabled?: boolean;
  authorName: string;
  onClose: () => void;
  onSubmit: (input: { title: string; description: string }) => void;
};

export function CreateDutyModal({
  open,
  disabled,
  authorName,
  onClose,
  onSubmit,
}: CreateDutyModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[600] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ title, description });
        }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="create-duty-title"
      >
        <h2 id="create-duty-title" className="text-sm font-bold text-foreground">
          Post a duty
        </h2>
        <p className="mt-1 text-xs text-subtle">
          Ask for a small favor — helpers can offer and name their reward.
        </p>

        <p className="mt-3 text-xs text-subtle">
          Posting as <strong className="text-foreground">{authorName || "Guest"}</strong>
        </p>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-semibold text-foreground">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Can u pls…"
            maxLength={200}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-semibold text-foreground">Details</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs doing, when, where…"
            rows={4}
            maxLength={2000}
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-subtle hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Post duty
          </button>
        </div>
      </form>
    </div>
  );
}
