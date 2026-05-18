import webpush from "web-push";
import type { PushMessageKind } from "@/lib/push/client";
import { chatMessagePreview } from "@/lib/push/client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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
  const admin = createAdminSupabaseClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) return [];
  return (data ?? []) as SubscriptionRow[];
}

async function resolveNotification(
  kind: PushMessageKind,
  messageId: string,
  senderId: string,
): Promise<{ recipientId: string; title: string; body: string; url: string } | null> {
  const admin = createAdminSupabaseClient();
  if (!admin) return null;

  if (kind === "duty_chat") {
    const { data: message } = await admin
      .from("duty_messages")
      .select("id, duty_id, sender_id, body, message_type")
      .eq("id", messageId)
      .maybeSingle();

    if (!message || message.sender_id !== senderId) return null;

    const { data: duty } = await admin
      .from("duties")
      .select("id, user_id, author_name, assigned_offer_id")
      .eq("id", message.duty_id)
      .maybeSingle();

    if (!duty?.assigned_offer_id) return null;

    const { data: offer } = await admin
      .from("duty_offers")
      .select("user_id, helper_name")
      .eq("id", duty.assigned_offer_id)
      .maybeSingle();

    if (!offer) return null;

    const authorId = duty.user_id as string;
    const helperId = offer.user_id as string;
    const recipientId = senderId === authorId ? helperId : authorId;
    const senderName =
      senderId === authorId
        ? ((duty.author_name as string) || "Author")
        : ((offer.helper_name as string) || "Helper");

    return {
      recipientId,
      title: `${senderName} (duty chat)`,
      body: chatMessagePreview(message.body as string, message.message_type as string),
      url: `/duties/${message.duty_id}`,
    };
  }

  if (kind === "ride_chat") {
    const { data: message } = await admin
      .from("ride_messages")
      .select("id, ride_id, sender_id, body, message_type")
      .eq("id", messageId)
      .maybeSingle();

    if (!message || message.sender_id !== senderId) return null;

    const { data: ride } = await admin
      .from("ride_requests")
      .select("id, user_id, rider_name, matched_offer_id")
      .eq("id", message.ride_id)
      .maybeSingle();

    if (!ride?.matched_offer_id) return null;

    const { data: offer } = await admin
      .from("ride_offers")
      .select("user_id, driver_name")
      .eq("id", ride.matched_offer_id)
      .maybeSingle();

    if (!offer) return null;

    const riderId = ride.user_id as string;
    const driverId = offer.user_id as string;
    const recipientId = senderId === riderId ? driverId : riderId;
    const senderName =
      senderId === riderId
        ? ((ride.rider_name as string) || "Rider")
        : ((offer.driver_name as string) || "Driver");

    return {
      recipientId,
      title: `${senderName} (ride chat)`,
      body: chatMessagePreview(message.body as string, message.message_type as string),
      url: `/rides/${message.ride_id}`,
    };
  }

  const { data: message } = await admin
    .from("dm_messages")
    .select("id, thread_id, sender_id, body")
    .eq("id", messageId)
    .maybeSingle();

  if (!message || message.sender_id !== senderId) return null;

  const { data: thread } = await admin
    .from("dm_threads")
    .select("id, topic_id, user_a_id, user_b_id")
    .eq("id", message.thread_id)
    .maybeSingle();

  if (!thread) return null;

  const userA = thread.user_a_id as string;
  const userB = thread.user_b_id as string;
  const recipientId = senderId === userA ? userB : userA;

  const { data: senderPost } = await admin
    .from("messages")
    .select("author_name")
    .eq("topic_id", thread.topic_id)
    .eq("user_id", senderId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const senderName = (senderPost?.author_name as string | undefined)?.trim() || "Someone";

  return {
    recipientId,
    title: `${senderName} (private chat)`,
    body: chatMessagePreview(message.body as string, "text"),
    url: `/topics/${thread.topic_id}`,
  };
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
          const admin = createAdminSupabaseClient();
          if (admin) {
            await admin
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
        }
      }
    }),
  );
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;
}
