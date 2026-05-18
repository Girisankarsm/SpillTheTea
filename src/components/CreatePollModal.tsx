"use client";

import { useEffect, useState } from "react";
import { MAX_POLL_OPTIONS, MIN_POLL_OPTIONS } from "@/lib/types/poll";

type CreatePollModalProps = {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSubmit: (input: { question: string; options: string[] }) => void;
};

export function CreatePollModal({
  open,
  disabled,
  onClose,
  onSubmit,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  useEffect(() => {
    if (!open) return;
    setQuestion("");
    setOptions(["", ""]);
  }, [open]);

  if (!open) return null;

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  }

  function addOption() {
    if (options.length >= MAX_POLL_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= MIN_POLL_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ question, options });
  }

  return (
    <div
      className="fixed inset-0 z-[600] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="create-poll-title"
      >
        <h2 id="create-poll-title" className="text-sm font-bold text-foreground">
          Start a poll
        </h2>
        <p className="mt-1 text-xs text-subtle">
          Ask the room — everyone gets one vote and can change it later.
        </p>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-semibold text-foreground">Question</span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What's the tea?"
            maxLength={500}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <fieldset className="mt-4 space-y-2">
          <legend className="text-xs font-semibold text-foreground">Options</legend>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                maxLength={200}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
              {options.length > MIN_POLL_OPTIONS ? (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="rounded-lg px-2 py-2 text-xs font-bold text-subtle hover:text-danger-text"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </fieldset>

        {options.length < MAX_POLL_OPTIONS ? (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-xs font-bold text-brand hover:underline"
          >
            + Add option
          </button>
        ) : null}

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
            Post poll
          </button>
        </div>
      </form>
    </div>
  );
}
