import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import {
  APP_NAME,
  LEGAL_CONTACT,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: `Terms of Service — ${APP_NAME}`,
  description: `Terms of Service for ${APP_NAME}.`,
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of {APP_NAME}. By accessing or
        using the app, you agree to these Terms and our{" "}
        <a href={PRIVACY_POLICY_URL} className="text-brand hover:underline">
          Privacy Policy
        </a>
        .
      </p>

      <section className="space-y-2">
        <h2>1. The service</h2>
        <p>
          {APP_NAME} lets users post anonymously under topics (&quot;Tea&quot;), discuss in
          replies, request or offer paid duties, share rides, chat privately after matches, and
          explore nearby activity on a map. The service is provided &quot;as is&quot; and may
          change over time.
        </p>
      </section>

      <section className="space-y-2">
        <h2>2. Eligibility</h2>
        <p>
          You must be at least 13 years old and able to form a binding agreement. You must sign
          in with Google to use the app. You are responsible for activity on your account.
        </p>
      </section>

      <section className="space-y-2">
        <h2>3. Your account &amp; anonymous identity</h2>
        <ul>
          <li>You sign in with Google; your email stays private in the app.</li>
          <li>You choose an anonymous public display name shown to others.</li>
          <li>Do not impersonate others or mislead users about your identity.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>4. User content</h2>
        <p>You are responsible for content you post, including text, images, polls, and links.</p>
        <p>You agree not to post content that:</p>
        <ul>
          <li>Breaks the law or encourages illegal activity</li>
          <li>Harasses, threatens, or abuses others</li>
          <li>Is hate speech, sexually exploitative, or violent</li>
          <li>Invades privacy or shares others&apos; personal data without consent</li>
          <li>Is spam, fraud, or malware</li>
        </ul>
        <p>
          All posts are user-generated. We do not endorse, verify, or guarantee the accuracy of
          user content.
        </p>
      </section>

      <section className="space-y-2">
        <h2>5. Duties, rides &amp; payments</h2>
        <ul>
          <li>Duties and rides are agreements between users, not employment or transport services provided by us.</li>
          <li>Rewards and payments are arranged directly between users (UPI, phone, or cash).</li>
          <li>{APP_NAME} does not guarantee completion, safety, quality, or payment.</li>
          <li>Meet in safe public places and use your own judgment.</li>
          <li>UPI/phone on your profile is only shown to a matched duty or ride poster.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>6. Moderation</h2>
        <p>
          Topic starters (and app admins) may close topics. We may remove content or restrict
          accounts that violate these Terms or harm the community, with or without notice.
        </p>
      </section>

      <section className="space-y-2">
        <h2>7. Intellectual property</h2>
        <p>
          The app name, branding, and software belong to the app operator. You keep ownership of
          content you post, but grant us a license to host, display, and distribute it within
          the service so the app can function.
        </p>
      </section>

      <section className="space-y-2">
        <h2>8. Disclaimers</h2>
        <p>
          THE APP IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT
          GUARANTEE UNINTERRUPTED, ERROR-FREE, OR SECURE OPERATION. USE AT YOUR OWN RISK.
        </p>
      </section>

      <section className="space-y-2">
        <h2>9. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL,
          SPECIAL, OR CONSEQUENTIAL DAMAGES, OR FOR USER CONTENT, OFF-APP PAYMENTS, IN-PERSON
          MEETUPS, RIDES, OR DISPUTES BETWEEN USERS.
        </p>
      </section>

      <section className="space-y-2">
        <h2>10. Termination</h2>
        <p>
          You may stop using the app at any time. We may suspend or terminate access if you
          violate these Terms or misuse the service.
        </p>
      </section>

      <section className="space-y-2">
        <h2>11. Changes</h2>
        <p>
          We may update these Terms. The &quot;Last updated&quot; date will change when we do.
          Continued use after changes means you accept the updated Terms.
        </p>
      </section>

      <section className="space-y-2">
        <h2>12. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href={LEGAL_CONTACT} className="text-brand hover:underline">
            GitHub Issues
          </a>
          . Public URLs for OAuth and app stores:
        </p>
        <ul>
          <li>
            Privacy Policy:{" "}
            <a href={PRIVACY_POLICY_URL} className="text-brand hover:underline">
              {PRIVACY_POLICY_URL}
            </a>
          </li>
          <li>
            Terms of Service:{" "}
            <a href={TERMS_OF_SERVICE_URL} className="text-brand hover:underline">
              {TERMS_OF_SERVICE_URL}
            </a>
          </li>
        </ul>
      </section>
    </LegalPage>
  );
}
