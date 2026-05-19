import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";
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
    <LegalPage
      title="Privacy Policy"
      summary="How SpillTheTea collects, uses, and protects your information when you talk, task, and ride near you."
    >
      <LegalSection id="intro" title="Overview">
        <p>
          This Privacy Policy explains how {APP_NAME} (&quot;we&quot;, &quot;us&quot;, &quot;the
          app&quot;) handles your data when you use{" "}
          <a href={PRODUCTION_APP_URL}>spilltheteahere.vercel.app</a>. By signing in, you agree to
          this policy and our{" "}
          <a href={TERMS_OF_SERVICE_URL}>Terms of Service</a>.
        </p>
      </LegalSection>

      <LegalSection id="collect" title="Information we collect">
        <ul>
          <li>
            <strong>Google sign-in:</strong> Account ID, email, and basic profile from Google.
            Your email is used for authentication and is not shown publicly.
          </li>
          <li>
            <strong>Anonymous profile:</strong> Display name, optional photo, and chakra score.
          </li>
          <li>
            <strong>Payment details (optional):</strong> UPI ID or phone for duties/rides. Hidden
            until you are matched with a poster.
          </li>
          <li>
            <strong>Content:</strong> Topics, posts, replies, polls, media, duties, rides, and
            private chats.
          </li>
          <li>
            <strong>Location (optional):</strong> Map and ride pickup/drop details you provide.
          </li>
          <li>
            <strong>Technical data:</strong> Session cookies and optional push notification tokens.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="use" title="How we use your information">
        <ul>
          <li>Run the app — auth, posting, chat, duties, rides, and map</li>
          <li>Share payment details only with matched duty/ride posters</li>
          <li>Send optional push notifications</li>
          <li>Keep the service secure and improve features</li>
        </ul>
      </LegalSection>

      <LegalSection id="public" title="What is public vs private">
        <ul>
          <li>
            <strong>Public:</strong> Display name, posts, replies, and profile photo.
          </li>
          <li>
            <strong>Private:</strong> Email, UPI/phone (until matched), and private chats.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="third-parties" title="Third-party services">
        <p>We use trusted providers including Google (sign-in), Supabase (data &amp; storage), Vercel (hosting), and Giphy (GIFs).</p>
        <p>
          Payments between users happen off-app via UPI, phone, or cash. We do not process in-app
          card payments today.
        </p>
      </LegalSection>

      <LegalSection id="choices" title="Your choices">
        <ul>
          <li>Choose what you post and your anonymous name</li>
          <li>Skip UPI/phone if you do not want off-app payments</li>
          <li>Decline push notifications in your browser</li>
          <li>Sign out at any time</li>
        </ul>
      </LegalSection>

      <LegalSection id="contact" title="Contact & updates">
        <p>
          We may update this policy. The date at the top shows when it last changed. Questions?{" "}
          <a href={LEGAL_CONTACT}>Contact us on GitHub</a>. See also our{" "}
          <a href={TERMS_OF_SERVICE_URL}>Terms of Service</a>.
        </p>
        <p>
          Public URL: <a href={PRIVACY_POLICY_URL}>{PRIVACY_POLICY_URL}</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
