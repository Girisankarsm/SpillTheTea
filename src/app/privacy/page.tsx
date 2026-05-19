import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { PRODUCTION_APP_URL } from "@/lib/app-url";
import {
  APP_NAME,
  LEGAL_LAST_UPDATED,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
  description: `Privacy Policy for ${APP_NAME}.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="How SpillTheTea collects, uses, and protects your information when you talk, task, and ride near you."
    >
      <article className="prose-legal space-y-8 text-sm leading-relaxed text-subtle [&_h2]:mt-10 [&_h2]:text-base [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2:first-child]:mt-0 [&_a]:font-semibold [&_a]:text-brand [&_a]:hover:underline [&_li]:ml-4 [&_li]:list-disc [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:space-y-2">
        <p>
          Effective {LEGAL_LAST_UPDATED}. Country version: India.
        </p>

        <p>
          This Privacy Policy explains how {APP_NAME} (&quot;we&quot;, &quot;us&quot;, &quot;the
          app&quot;) handles your information when you use{" "}
          <a href={PRODUCTION_APP_URL}>spilltheteahere.vercel.app</a>. By signing in, you agree to
          this policy and our <a href={TERMS_OF_SERVICE_URL}>Terms of Service</a>.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Google sign-in:</strong> Account ID, email, and basic profile from Google.
            Your email is used for authentication and is not shown publicly.
          </li>
          <li>
            <strong>Anonymous profile:</strong> Display name, optional photo, and chakra score.
          </li>
          <li>
            <strong>Payment details (optional):</strong> UPI ID or phone for duties and rides.
            Hidden until you are matched with a poster.
          </li>
          <li>
            <strong>Content:</strong> Topics, posts, replies, polls, media, duties, rides, and
            private chats you create.
          </li>
          <li>
            <strong>Location (optional):</strong> Map and ride pickup/drop details you choose to
            provide.
          </li>
          <li>
            <strong>Technical data:</strong> Session cookies and optional push notification
            tokens.
          </li>
        </ul>

        <h2>How we use your information</h2>
        <ul>
          <li>Run the app — sign-in, posting, chat, duties, rides, and map</li>
          <li>Share payment details only with matched duty or ride posters</li>
          <li>Send optional push notifications you allow in your browser</li>
          <li>Keep the service secure, prevent abuse, and improve features</li>
        </ul>

        <h2>What is public vs private</h2>
        <ul>
          <li>
            <strong>Public:</strong> Your display name, posts, replies, and profile photo.
          </li>
          <li>
            <strong>Private:</strong> Your email, UPI/phone (until matched), and private chats.
          </li>
        </ul>
        <p>
          We do not sell your personal information. We do not show your Google email on your
          public profile.
        </p>

        <h2>Third-party services</h2>
        <p>
          We use trusted providers to run the app, including Google (sign-in), Supabase (database
          and storage), Vercel (hosting), and Giphy (GIF search). Each provider handles data under
          their own policies when you use their services through us.
        </p>
        <p>
          Payments between users happen off-app via UPI, phone, or cash. We do not process in-app
          card payments.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Choose what you post and your anonymous public name</li>
          <li>Skip UPI/phone if you do not want off-app payments</li>
          <li>Decline push notifications in your browser settings</li>
          <li>Sign out at any time</li>
        </ul>

        <h2>Security and retention</h2>
        <p>
          We use reasonable measures to protect your data, but no online service is perfectly
          secure. We keep information as long as needed to run the app, comply with law, and
          resolve disputes.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this policy as the app or the law changes. The date at the top shows when
          it last changed. Continued use after an update means you accept the revised policy. See
          also our <a href={TERMS_OF_SERVICE_URL}>Terms of Service</a>.
        </p>
        <p>
          Public URL: <a href={PRIVACY_POLICY_URL}>{PRIVACY_POLICY_URL}</a>
        </p>
      </article>
    </LegalPage>
  );
}
