import webpush from "web-push";
import type { PushMessageKind } from "@/lib/push/client";
import { ObjectId } from "mongodb";
import { mongoCollections } from "@/lib/mongodb/collections";

type SubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function configureWebPush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:hello@spillthetea.app";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function loadRecipientSubscriptions(userId: string): Promise<SubscriptionRow[]> {
  if (!ObjectId.isValid(userId)) return [];
  const pushSubscriptions = await mongoCollections.pushSubscriptions();
  const docs = await pushSubscriptions
    .find({ userId: new ObjectId(userId) })
    .toArray();
  return docs.map((doc) => ({
    endpoint: String(doc.endpoint),
    p256dh: String((doc.keys as { p256dh?: string })?.p256dh ?? ""),
    auth: String((doc.keys as { auth?: string })?.auth ?? ""),
  }));
}

async function resolveNotification(
  kind: PushMessageKind,
  messageId: string,
  senderId: string,
): Promise<{ recipientId: string; title: string; body: string; url: string } | null> {
  console.warn("Mongo push notification recipient resolution is not implemented yet.", {
    kind,
    messageId,
    senderId,
  });
  return null;
}

export async function sendPushForMessage(
  kind: PushMessageKind,
  messageId: string,
  senderId: string,
): Promise<void> {
  if (!configureWebPush()) return;

  const notification = await resolveNotification(kind, messageId, senderId);
  if (!notification) return;

  const subscriptions = await loadRecipientSubscriptions(notification.recipientId);
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url,
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          const pushSubscriptions = await mongoCollections.pushSubscriptions();
          await pushSubscriptions.deleteOne({ endpoint: sub.endpoint });
        }
      }
    }),
  );
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;
}
