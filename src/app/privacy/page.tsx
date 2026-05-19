import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { PRODUCTION_APP_URL } from "@/lib/app-url";
import {
  APP_NAME,
  LEGAL_CONTACT,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
  description: `Privacy Policy for ${APP_NAME}.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This Privacy Policy explains how {APP_NAME} (&quot;we&quot;, &quot;us&quot;, &quot;the
        app&quot;) collects, uses, and protects information when you use our web app at{" "}
        <a href={PRODUCTION_APP_URL} className="text-brand hover:underline">
          spilltheteahere.vercel.app
        </a>
        .
      </p>

      <section className="space-y-2">
        <h2>1. Who we are</h2>
        <p>
          {APP_NAME} is an anonymous community app for topics (&quot;Tea&quot;), duties, ride
          pooling, and chat. By signing in, you agree to this policy and our Terms of Service.
        </p>
      </section>

      <section className="space-y-2">
        <h2>2. Information we collect</h2>
        <ul>
          <li>
            <strong>Google account (sign-in):</strong> When you sign in with Google, we receive
            your account identifier and basic profile info from Google (such as email and name).
            Your email is used for authentication and is not shown publicly in the app.
          </li>
          <li>
            <strong>Anonymous public profile:</strong> You choose a public display name and may
            add a profile photo. Other users see your display name and chakra score, not your
            email.
          </li>
          <li>
            <strong>Payment details (optional):</strong> If you add a UPI ID or phone number on
            your profile, it is stored so a duty or ride poster can pay you after you are
            matched. These details are not public and are only shared with the matched poster
            for that duty or ride.
          </li>
          <li>
            <strong>Content you post:</strong> Topics, messages, replies, polls, media, duty and
            ride listings, and private chat messages.
          </li>
          <li>
            <strong>Location (optional):</strong> If you use map or ride features, you may provide
            location labels or coordinates for pickups, drops, or nearby topics.
          </li>
          <li>
            <strong>Device &amp; usage data:</strong> We use cookies/session tokens for sign-in,
            and may store push notification subscription data if you enable notifications.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>3. How we use information</h2>
        <ul>
          <li>Provide and operate the app (auth, posting, chat, duties, rides, map)</li>
          <li>Match helpers/drivers with posters and show payment details when allowed</li>
          <li>Send optional push notifications for messages and matches</li>
          <li>Keep the service secure and prevent abuse</li>
          <li>Improve features and fix bugs</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>4. What is public vs private</h2>
        <ul>
          <li>
            <strong>Public:</strong> Your anonymous display name, posts, replies, and profile
            photo (if set).
          </li>
          <li>
            <strong>Private:</strong> Your Google email, UPI/phone (until shared with a matched
            duty/ride poster), and private chats between matched users.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>5. Third-party services</h2>
        <p>We use trusted providers to run the app, including:</p>
        <ul>
          <li>Google — sign-in (OAuth)</li>
          <li>Supabase — database, authentication, file storage, realtime</li>
          <li>Vercel — hosting</li>
          <li>Giphy — GIF search (when you use that feature)</li>
        </ul>
        <p>
          Payments between users (UPI, phone, cash) happen outside the app directly between
          users. We do not process card or bank payments inside {APP_NAME} today.
        </p>
      </section>

      <section className="space-y-2">
        <h2>6. Data retention &amp; deletion</h2>
        <p>
          We keep your data while your account is active and as needed to operate the service.
          Topic starters (or app admins) may close topics. You may request account or data
          deletion by contacting us (see Contact below).
        </p>
      </section>

      <section className="space-y-2">
        <h2>7. Children</h2>
        <p>
          {APP_NAME} is not intended for children under 13. We do not knowingly collect data
          from children under 13.
        </p>
      </section>

      <section className="space-y-2">
        <h2>8. Your choices</h2>
        <ul>
          <li>Choose what you post and your anonymous display name</li>
          <li>Do not add UPI/phone if you do not want to receive off-app payments</li>
          <li>Decline or revoke push notification permission in your browser</li>
          <li>Sign out at any time</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>9. Changes</h2>
        <p>
          We may update this Privacy Policy. The &quot;Last updated&quot; date at the top will
          change when we do. Continued use of the app after changes means you accept the updated
          policy.
        </p>
      </section>

      <section className="space-y-2">
        <h2>10. Contact</h2>
        <p>
          For privacy questions or requests, contact us via{" "}
          <a href={LEGAL_CONTACT} className="text-brand hover:underline">
            GitHub Issues
          </a>
          . See also our{" "}
          <a href={TERMS_OF_SERVICE_URL} className="text-brand hover:underline">
            Terms of Service
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
