"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "spillthetea-install-dismissed-v1";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (!isMobileDevice()) return;

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (isIosDevice()) {
      setVisible(true);
      return;
    }

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setCanInstall(true);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstall(false);
      if (outcome === "accepted") {
        setVisible(false);
      }
      return;
    }

    setShowSteps(true);
  }

  if (!visible) return null;

  return (
    <div className="border-b border-brand/25 bg-brand-soft px-3 py-2.5 text-xs text-foreground">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">Add SpillTheTea to your home screen</p>
          {showSteps || isIosDevice() ? (
            <p className="text-[11px] leading-relaxed text-subtle">
              {isIosDevice() ? (
                <>
                  Tap <strong className="text-foreground">Share</strong> in Safari, then{" "}
                  <strong className="text-foreground">Add to Home Screen</strong>.
                </>
              ) : (
                <>
                  Tap the browser menu (<strong className="text-foreground">⋮</strong>), then{" "}
                  <strong className="text-foreground">Install app</strong> or{" "}
                  <strong className="text-foreground">Add to Home screen</strong>.
                </>
              )}
            </p>
          ) : (
            <p className="text-[11px] text-subtle">
              Open full-screen from your phone like an app — no browser bar.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canInstall ? (
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="rounded-lg bg-brand px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90"
            >
              Install
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-bold text-foreground hover:bg-background"
            >
              How
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install banner"
            className="rounded-md px-2 py-1 text-base leading-none text-subtle hover:bg-background hover:text-foreground"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
