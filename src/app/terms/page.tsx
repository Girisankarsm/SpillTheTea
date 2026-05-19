import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";
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
    <LegalPage
      title="Terms of Service"
      summary="The rules for using SpillTheTea — anonymous Tea, duties, rides, and chat in your area."
    >
      <LegalSection id="intro" title="Agreement">
        <p>
          These Terms govern your use of {APP_NAME}. By signing in or using the app, you agree to
          these Terms and our{" "}
          <a href={PRIVACY_POLICY_URL}>Privacy Policy</a>.
        </p>
      </LegalSection>

      <LegalSection id="service" title="The service">
        <p>
          {APP_NAME} provides anonymous topics (&quot;Tea&quot;), paid duties, ride pooling, private
          chat, and a local map. The service is provided &quot;as is&quot; and may change over
          time.
        </p>
      </LegalSection>

      <LegalSection id="account" title="Your account">
        <ul>
          <li>Sign in with Google. You must be at least 13 years old.</li>
          <li>Your email stays private. You choose an anonymous public name.</li>
          <li>Do not impersonate others or mislead users.</li>
          <li>You are responsible for activity on your account.</li>
        </ul>
      </LegalSection>

      <LegalSection id="content" title="User content">
        <p>You are responsible for what you post. Do not post content that is illegal, abusive, hateful, harassing, fraudulent, or invades others&apos; privacy.</p>
        <p>All posts are user-generated. We do not verify or endorse user content.</p>
      </LegalSection>

      <LegalSection id="payments" title="Duties, rides & payments">
        <ul>
          <li>Duties and rides are agreements between users, not services we provide.</li>
          <li>Payments are arranged directly (UPI, phone, or cash).</li>
          <li>We do not guarantee safety, completion, or payment.</li>
          <li>UPI/phone is only shown to a matched duty or ride poster.</li>
        </ul>
      </LegalSection>

      <LegalSection id="moderation" title="Moderation">
        <p>
          Topic starters and app admins may close topics. We may remove content or restrict accounts
          that violate these Terms.
        </p>
      </LegalSection>

      <LegalSection id="legal" title="Disclaimers & liability">
        <p>
          THE APP IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES. WE ARE NOT LIABLE FOR USER
          CONTENT, OFF-APP PAYMENTS, IN-PERSON MEETUPS, RIDES, OR DISPUTES BETWEEN USERS.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact & updates">
        <p>
          We may update these Terms. Continued use means you accept the updated Terms. Questions?{" "}
          <a href={LEGAL_CONTACT}>Contact us on GitHub</a>.
        </p>
        <p>
          Public URLs:{" "}
          <a href={TERMS_OF_SERVICE_URL}>{TERMS_OF_SERVICE_URL}</a>
          {" · "}
          <a href={PRIVACY_POLICY_URL}>{PRIVACY_POLICY_URL}</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
