"use client";

import { useCallback, useEffect, useState } from "react";
import { useBackend } from "@/components/BackendProvider";

const DISMISS_KEY = "spillthetea-push-dismissed-v1";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return;

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });
}

export function usePushNotifications(enabled: boolean) {
  const { backend, remoteReady } = useBackend();

  const syncSubscription = useCallback(async () => {
    if (!enabled || !remoteReady || !backend) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const registration = await registerServiceWorker();
    if (!registration) return;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      const json = existing.toJSON();
      if (json.endpoint && json.keys?.p256dh && json.keys.auth) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          }),
        });
      }
      return;
    }

    await subscribeToPush(registration);
  }, [enabled, remoteReady, backend]);

  useEffect(() => {
    if (!enabled || !remoteReady) return;
    void registerServiceWorker();
  }, [enabled, remoteReady]);

  useEffect(() => {
    void syncSubscription();
  }, [syncSubscription]);

  return { syncSubscription };
}

export function PushNotificationPrompt() {
  const { remoteReady } = useBackend();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!remoteReady) return;
    if (typeof Notification === "undefined") return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    setVisible(true);
  }, [remoteReady]);

  async function handleEnable() {
    setBusy(true);
    try {
      const registration = await registerServiceWorker();
      if (!registration) {
        alert("Push notifications are not supported in this browser.");
        return;
      }
      await subscribeToPush(registration);
      setVisible(false);
    } catch {
      alert("Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="border-b border-border bg-background px-3 py-2.5 text-xs text-foreground">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">Turn on message notifications</p>
          <p className="text-[11px] leading-relaxed text-subtle">
            Get alerts for private chats, duty chat, and ride chat when you&apos;re away.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void handleEnable()}
            disabled={busy}
            className="rounded-lg bg-brand px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            Enable
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss notification prompt"
            className="rounded-md px-2 py-1 text-base leading-none text-subtle hover:bg-surface hover:text-foreground"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export function PushNotificationManager() {
  const { remoteReady } = useBackend();
  usePushNotifications(remoteReady);
  return null;
}
