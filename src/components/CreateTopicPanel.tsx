"use client";

import { useEffect, useRef, useState } from "react";
import { GifPicker } from "@/components/GifPicker";
import { isAllowedMediaUrl } from "@/lib/message-thread";
import { MAX_POLL_OPTIONS, MIN_POLL_OPTIONS } from "@/lib/types/poll";

const TITLE_MAX = 300;
const BODY_MAX = 4000;

export type CreatePostKind = "text" | "media" | "link" | "poll";

export type CreateTopicPayload = {
  kind: CreatePostKind;
  title: string;
  body: string;
  linkUrl: string;
  mediaFile: File | null;
  gifUrl: string;
  pollQuestion: string;
  pollOptions: string[];
};

type CreateTopicPanelProps = {
  onSubmit: (payload: CreateTopicPayload) => Promise<void> | void;
  disabled?: boolean;
  submitting?: boolean;
};

const tabs: { id: CreatePostKind; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "media", label: "Images & Video" },
  { id: "link", label: "Link" },
  { id: "poll", label: "Poll" },
];

function isValidHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function CreateTopicPanel({
  onSubmit,
  disabled = false,
  submitting = false,
}: CreateTopicPanelProps) {
  const [activeTab, setActiveTab] = useState<CreatePostKind>("text");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [gifUrl, setGifUrl] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mediaFile) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(mediaFile);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  function resetForm() {
    setTitle("");
    setBody("");
    setLinkUrl("");
    setMediaFile(null);
    setGifUrl("");
    setPollQuestion("");
    setPollOptions(["", ""]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function clearMedia() {
    setMediaFile(null);
    setGifUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function updatePollOption(index: number, value: string) {
    setPollOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  }

  function addPollOption() {
    if (pollOptions.length >= MAX_POLL_OPTIONS) return;
    setPollOptions((prev) => [...prev, ""]);
  }

  function removePollOption(index: number) {
    if (pollOptions.length <= MIN_POLL_OPTIONS) return;
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  }

  const titleValid = title.trim().length > 0;
  const pollLabels = pollOptions.map((o) => o.trim()).filter(Boolean);

  const tabValid =
    activeTab === "text" ||
    (activeTab === "media" && (Boolean(mediaFile) || Boolean(gifUrl.trim()))) ||
    (activeTab === "link" && isValidHttpUrl(linkUrl)) ||
    (activeTab === "poll" &&
      pollQuestion.trim().length > 0 &&
      pollLabels.length >= MIN_POLL_OPTIONS);

  const canPost = titleValid && tabValid && !disabled && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPost) return;

    await onSubmit({
      kind: activeTab,
      title: title.trim(),
      body: body.trim(),
      linkUrl: linkUrl.trim(),
      mediaFile,
      gifUrl: gifUrl.trim(),
      pollQuestion: pollQuestion.trim(),
      pollOptions: pollLabels,
    });

    resetForm();
  }

  return (
    <>
      <form
        onSubmit={(e) => void handleSubmit(e)}
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
              onClick={() => setActiveTab(tab.id)}
              className={[
                "shrink-0 border-b-2 py-3 text-sm font-bold transition",
                activeTab === tab.id
                  ? "border-brand text-foreground"
                  : "border-transparent text-subtle hover:text-foreground",
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
              onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
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

          {activeTab === "text" ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
              placeholder="Body text (optional)"
              rows={6}
              disabled={disabled}
              className="w-full resize-y rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none placeholder:text-subtle focus:ring-2 focus:ring-brand disabled:opacity-50"
            />
          ) : null}

          {activeTab === "media" ? (
            <div className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/*"
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file) setGifUrl("");
                  setMediaFile(file);
                }}
              />
              {filePreview || gifUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={filePreview ?? gifUrl}
                    alt="Media preview"
                    className="max-h-56 w-full rounded-xl object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearMedia}
                    className="absolute right-4 top-4 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white hover:bg-black/80"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={disabled}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-brand-soft disabled:opacity-50"
                  >
                    From device
                  </button>
                  <button
                    type="button"
                    onClick={() => setGifPickerOpen(true)}
                    disabled={disabled}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-brand-soft disabled:opacity-50"
                  >
                    Browse GIFs
                  </button>
                </div>
              )}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                placeholder="Caption (optional)"
                rows={3}
                disabled={disabled}
                className="w-full resize-y rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none placeholder:text-subtle focus:ring-2 focus:ring-brand disabled:opacity-50"
              />
            </div>
          ) : null}

          {activeTab === "link" ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Link URL<span className="text-danger-text">*</span>
                </label>
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                  disabled={disabled}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                />
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                placeholder="Add a note (optional)"
                rows={4}
                disabled={disabled}
                className="w-full resize-y rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none placeholder:text-subtle focus:ring-2 focus:ring-brand disabled:opacity-50"
              />
            </div>
          ) : null}

          {activeTab === "poll" ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Poll question<span className="text-danger-text">*</span>
                </label>
                <input
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value.slice(0, 500))}
                  placeholder="What's the tea?"
                  disabled={disabled}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold text-foreground">
                  Options<span className="text-danger-text">*</span>
                </legend>
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      maxLength={200}
                      disabled={disabled}
                      className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                    />
                    {pollOptions.length > MIN_POLL_OPTIONS ? (
                      <button
                        type="button"
                        onClick={() => removePollOption(index)}
                        className="rounded-lg px-2 py-2 text-xs font-bold text-subtle hover:text-danger-text"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
              </fieldset>
              {pollOptions.length < MAX_POLL_OPTIONS ? (
                <button
                  type="button"
                  onClick={addPollOption}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  + Add option
                </button>
              ) : null}
            </div>
          ) : null}
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

      <GifPicker
        open={gifPickerOpen}
        onClose={() => setGifPickerOpen(false)}
        onSelect={(url) => {
          if (!isAllowedMediaUrl(url)) return;
          setMediaFile(null);
          if (fileRef.current) fileRef.current.value = "";
          setGifUrl(url);
          setGifPickerOpen(false);
        }}
      />
    </>
  );
}
