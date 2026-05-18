"use client";

import { useCallback, useEffect, useState } from "react";

export type GifItem = {
  id: string;
  title: string;
  previewUrl: string;
  url: string;
};

type GifPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export function GifPicker({ open, onClose, onSelect }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGifs = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`/api/gifs${params}`);
      const json = (await res.json()) as { gifs?: GifItem[]; error?: string };
      if (!res.ok) {
        setGifs([]);
        setError(json.error ?? "Could not load GIFs.");
        return;
      }
      setGifs(json.gifs ?? []);
    } catch {
      setGifs([]);
      setError("Could not load GIFs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    void loadGifs("");
  }, [open, loadGifs]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void loadGifs(query), 350);
    return () => window.clearTimeout(timer);
  }, [open, query, loadGifs]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[700] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(85vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Browse GIFs"
      >
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs…"
            autoFocus
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-bold text-subtle hover:bg-background hover:text-foreground"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-subtle">Loading GIFs…</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-danger-text">{error}</p>
          ) : gifs.length === 0 ? (
            <p className="py-8 text-center text-sm text-subtle">No GIFs found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  title={gif.title}
                  onClick={() => {
                    onSelect(gif.url);
                    onClose();
                  }}
                  className="aspect-square overflow-hidden rounded-lg border border-border bg-background hover:ring-2 hover:ring-brand"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gif.previewUrl}
                    alt={gif.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="border-t border-border px-4 py-2 text-center text-[10px] text-subtle">
          Powered by GIPHY
        </p>
      </div>
    </div>
  );
}
