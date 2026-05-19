import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import {
  APP_NAME,
  LEGAL_LAST_UPDATED,
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
      summary="The rules for using SpillTheTea — anonymous Tea, duties, rides, and chat near you."
    >
      <article className="prose-legal space-y-8 text-sm leading-relaxed text-subtle [&_h2]:mt-10 [&_h2]:text-base [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2:first-child]:mt-0 [&_a]:font-semibold [&_a]:text-brand [&_a]:hover:underline [&_li]:ml-4 [&_li]:list-disc [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:space-y-2">
        <p>
          Effective {LEGAL_LAST_UPDATED}. Country version: India.
        </p>

        <p>
          These Terms of Service explain what you can expect from {APP_NAME} and what we expect
          from you. By signing in or using the app, you agree to these Terms and our{" "}
          <a href={PRIVACY_POLICY_URL}>Privacy Policy</a>. The Privacy Policy is separate but
          describes how we handle your data.
        </p>

        <h2>What’s covered</h2>
        <p>
          {APP_NAME} lets you post anonymous topics (&quot;Tea&quot;), offer or take paid duties,
          share ride pooling, chat privately, and use a local map. These Terms apply to all of
          that. They cover what we provide, how you may use the app, your content, payments
          between users, and what happens if something goes wrong.
        </p>

        <h2>Service provider</h2>
        <p>
          {APP_NAME} is operated as an independent community app. It is not affiliated with,
          endorsed by, or operated by Google. Google sign-in is used only for authentication.
        </p>

        <h2>Age requirements</h2>
        <p>
          You must be at least 13 years old to use {APP_NAME}. If you are under the age required
          to manage your own Google Account in your country, you need a parent or legal
          guardian&apos;s permission. If you are a parent or guardian and allow a child to use the
          app, you are responsible for their activity.
        </p>

        <h2>Your relationship with us</h2>
        <p>
          We give you permission to use {APP_NAME} if you follow these Terms. We may add, change,
          or remove features over time. If we make a material change that negatively affects your
          use of the app, we will try to give reasonable notice when possible.
        </p>

        <h3 className="mt-6 text-sm font-bold text-foreground">What you can expect from us</h3>
        <ul>
          <li>
            A place to post Tea, duties, rides, and messages under the anonymous name you choose
          </li>
          <li>Private sign-in via Google — your email is not shown publicly</li>
          <li>
            Optional payment details (UPI or phone) shared only with a matched duty or ride poster
          </li>
          <li>A service provided &quot;as is&quot;, which may change, break, or be unavailable at times</li>
        </ul>

        <h3 className="mt-6 text-sm font-bold text-foreground">What we expect from you</h3>
        <ul>
          <li>Follow these Terms and applicable law</li>
          <li>
            Be respectful — do not harass, bully, defraud, impersonate, stalk, or threaten others
          </li>
          <li>
            Do not post illegal, abusive, hateful, obscene, or privacy-invading content
          </li>
          <li>
            Do not spam, hack, scrape, bypass security, or misuse the app in deceptive ways
          </li>
          <li>Do not use the app for medical, legal, or financial advice you rely on without a professional</li>
        </ul>

        <h2>Your account</h2>
        <p>
          You sign in with Google. You choose an anonymous public name and optional photo. Others
          see that public profile and your chakra score — not your email or Google account details.
          You are responsible for keeping your account secure and for activity under your account.
          Do not share access or impersonate another person.
        </p>

        <h2>Your content</h2>
        <p>
          You keep ownership of content you create. By posting, you give us a limited license to
          host, display, and distribute that content so the app works — for example, showing your
          posts to other users, storing images, and moderating abuse. That license ends when you
          remove content, except where others already copied or reshared it, or where we must keep
          records for legal or safety reasons.
        </p>
        <p>
          All posts, duties, rides, and chats are user-generated. We do not verify, endorse, or
          guarantee user content. You are responsible for what you post and for having the rights
          to share it.
        </p>

        <h2>Duties, rides, and payments</h2>
        <p>
          Duties and rides are arrangements between users, not services we provide or guarantee.
          Payment is handled directly between users (UPI, phone, or cash) outside the app. We do
          not process card payments, hold funds, or guarantee that work is done, rides are safe,
          or money is paid.
        </p>
        <p>
          Meeting people in person, riding in vehicles, and paying others carry real-world risks.
          Use your own judgment. {APP_NAME} is not responsible for disputes, injuries, losses, or
          fraud between users.
        </p>

        <h2>Moderation and enforcement</h2>
        <p>
          Topic starters and app admins may close topics or remove content that breaks the rules.
          We may remove content, suspend features, or restrict accounts if we reasonably believe
          you violated these Terms, applicable law, or could harm other users or the service. When
          possible, we will explain why we took action.
        </p>

        <h2>Disclaimers and liability</h2>
        <p>
          THE APP IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXCEPT WHERE
          REQUIRED BY LAW. WE ARE NOT LIABLE FOR USER CONTENT, OFF-APP PAYMENTS, IN-PERSON
          MEETUPS, RIDES, OR DISPUTES BETWEEN USERS, EXCEPT WHERE LIABILITY CANNOT BE LIMITED
          UNDER APPLICABLE LAW.
        </p>
        <p>
          To the extent allowed by law, our total liability for claims relating to these Terms is
          limited to the amount you paid us to use the app in the 12 months before the claim, or
          zero if you did not pay us.
        </p>

        <h2>Disputes and governing law</h2>
        <p>
          These Terms are governed by the laws of India, without regard to conflict-of-law rules.
          Courts in India will have jurisdiction over disputes, except where local law gives you
          rights that cannot be waived.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these Terms to reflect changes to the app, the law, or how we operate. If
          we make material changes, we will try to give reasonable notice. Continued use after
          changes means you accept the updated Terms. If you do not agree, stop using the app and
          sign out.
        </p>
        <p>
          Public URL: <a href={TERMS_OF_SERVICE_URL}>{TERMS_OF_SERVICE_URL}</a>
        </p>
      </article>
    </LegalPage>
  );
}
