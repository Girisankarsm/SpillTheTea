"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { roomShareText } from "@/lib/share-room";

type ShareRoomModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  roomUrl: string;
};

export function ShareRoomModal({
  open,
  onClose,
  title,
  roomUrl,
}: ShareRoomModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrErr, setQrErr] = useState(false);

  useEffect(() => {
    if (!open) {
      setQrDataUrl(null);
      setQrErr(false);
      setCopied(false);
      return;
    }

    let cancelled = false;
    void QRCode.toDataURL(roomUrl, {
      width: 200,
      margin: 2,
      color: { dark: "#1c1917", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrErr(true);
      });

    return () => {
      cancelled = true;
    };
  }, [open, roomUrl]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy — select the link and copy manually.");
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `${title} · SpillTheTea`,
        text: roomShareText(title),
        url: roomUrl,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }

  if (!open) return null;

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div
      className="fixed inset-0 z-[700] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-room-title"
      >
        <header className="border-b border-border px-4 py-3">
          <h2 id="share-room-title" className="text-sm font-bold text-foreground">
            Share this convo
          </h2>
          <p className="mt-0.5 truncate text-xs text-subtle">{title}</p>
        </header>

        <div className="space-y-4 px-4 py-4">
          <div className="flex flex-col items-center gap-2">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`QR code to join ${title}`}
                className="rounded-xl border border-border bg-white p-2"
                width={200}
                height={200}
              />
            ) : qrErr ? (
              <p className="py-8 text-center text-xs text-subtle">
                Could not make QR — use the link below.
              </p>
            ) : (
              <p className="py-8 text-center text-xs text-subtle">Making QR…</p>
            )}
            <p className="text-center text-[11px] text-subtle">
              Scan to open this tea room
            </p>
          </div>

          <label className="block text-xs font-semibold text-foreground">
            Room link
            <input
              readOnly
              value={roomUrl}
              onFocus={(e) => e.target.select()}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
            {canNativeShare ? (
              <button
                type="button"
                onClick={() => void nativeShare()}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground hover:bg-brand-soft"
              >
                Share…
              </button>
            ) : null}
          </div>
        </div>

        <footer className="border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg px-3 py-2 text-sm font-bold text-subtle hover:bg-background hover:text-foreground"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
