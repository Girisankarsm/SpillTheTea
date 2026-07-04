"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { LegalFooterLinks } from "@/components/LegalFooterLinks";
import { useBackend } from "@/components/BackendProvider";
import { APP_DISCLAIMER } from "@/lib/disclaimer";
import { setLegalAcceptanceCookie } from "@/lib/legal-acceptance";
import { PRIVACY_POLICY_PATH, TERMS_OF_SERVICE_PATH } from "@/lib/legal";
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithMagicLink,
  signUpWithEmail,
  resendSignupConfirmationEmail,
  isGoogleSignedIn,
} from "@/lib/backend/auth";

type AuthMode = "login" | "register";
type SignInMethod = "password" | "magiclink";

/** Shared input styling inside auth card */
const FIELD_SHELL =
  "w-full rounded-xl border border-white/10 bg-black/35 py-3.5 pl-4 text-sm text-foreground outline-none transition placeholder:text-subtle/70 focus:border-violet-500/45 focus:ring-2 focus:ring-violet-500/20";

const BTN_GRADIENT =
  "w-full rounded-xl bg-gradient-to-r from-[#6366f1] to-[#2563eb] py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/35 transition hover:brightness-[1.06] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-45";

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LegalDocLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-violet-300 underline-offset-2 hover:text-violet-200 hover:underline"
    >
      {children}
    </Link>
  );
}

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/topics";
  if (raw === "/" || raw.startsWith("/login") || raw.startsWith("/auth/callback")) return "/topics";
  return raw;
}

function isLocalNetworkHost(hostname: string): boolean {
  return (
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

function networkLoginHint(): string | null {
  if (typeof window === "undefined") return null;
  const { hostname, port, protocol } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return null;
  if (!isLocalNetworkHost(hostname)) return null;
  const origin = `${protocol}//${hostname}${port ? `:${port}` : ""}`;
  return origin;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label htmlFor={id} className="block w-full space-y-2 text-left">
      <span className="text-xs font-medium tracking-wide text-subtle">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${FIELD_SHELL} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-subtle transition hover:bg-white/10 hover:text-foreground"
        >
          {visible ? (
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </label>
  );
}

function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly { id: T; label: string }[];
}) {
  return (
    <div
      className="flex w-full gap-1 rounded-xl bg-black/40 p-1 ring-1 ring-white/10"
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={[
              "flex-1 rounded-lg py-2.5 text-sm font-semibold transition",
              active
                ? "bg-gradient-to-r from-[#6366f1] to-[#2563eb] text-white shadow-md shadow-indigo-950/30"
                : "text-subtle hover:text-foreground",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function OrDivider() {
  return (
    <div className="flex w-full items-center gap-4 py-1">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-subtle">or</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const authFailed = searchParams.get("auth") === "failed";
  const legalRequired = searchParams.get("auth") === "legal";

  const { backend, session, authReady, configured } = useBackend();
  const [mode, setMode] = useState<AuthMode>("login");
  const [signInMethod, setSignInMethod] = useState<SignInMethod>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const canSubmit = acceptedTerms && acceptedPrivacy;
  const alreadySignedIn = authReady && isGoogleSignedIn(session);
  const networkOrigin = networkLoginHint();

  function resetMessages() {
    setFormError(null);
    setFormSuccess(null);
  }

  async function handleResendConfirmation() {
    if (!backend || !email.trim() || resendBusy) return;
    resetMessages();
    setResendBusy(true);
    try {
      const { error } = await resendSignupConfirmationEmail(backend, email);
      if (error) {
        setFormError(error.message);
        return;
      }
      setFormSuccess("Confirmation email sent — check your inbox and spam.");
    } finally {
      setResendBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!backend || !canSubmit || busy) return;
    resetMessages();
    setBusy(true);
    try {
      setLegalAcceptanceCookie();
      const { error } = await signInWithGoogle(backend, nextPath);
      if (error) setFormError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink(event: React.FormEvent) {
    event.preventDefault();
    if (!backend || !canSubmit || busy) return;
    resetMessages();

    if (!email.trim()) {
      setFormError("Enter your email.");
      return;
    }

    setBusy(true);
    try {
      setLegalAcceptanceCookie();
      const { error } = await signInWithMagicLink(backend, email, nextPath);
      if (error) {
        setFormError(error.message);
        return;
      }
      setFormSuccess("Check your email — we sent you a sign-in link.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!backend || !canSubmit || busy) return;
    resetMessages();

    if (!email.trim() || !password) {
      setFormError("Enter your email and password.");
      return;
    }

    setBusy(true);
    try {
      setLegalAcceptanceCookie();
      const { error } = await signInWithEmail(backend, email, password);
      if (error) {
        const msg = error.message.toLowerCase().includes("email not confirmed")
          ? "Confirm your email first — check your inbox (and spam), then log in."
          : error.message;
        setFormError(msg);
        return;
      }
      router.replace(nextPath);
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailRegister(event: React.FormEvent) {
    event.preventDefault();
    if (!backend || !canSubmit || busy) return;
    resetMessages();

    if (!email.trim() || !password) {
      setFormError("Enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      setLegalAcceptanceCookie();
      const { error, needsEmailConfirmation } = await signUpWithEmail(
        backend,
        email,
        password,
      );
      if (error) {
        setFormError(error.message);
        return;
      }
      if (needsEmailConfirmation) {
        setFormSuccess(
          "If this email wasn’t registered before, open the inbox link we sent — then log in here with email and password. If you already have an account or don’t see a message within a few minutes, use Sign in or Resend confirmation (spam folder too).",
        );
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }
      router.replace(nextPath);
    } finally {
      setBusy(false);
    }
  }

  const headline = alreadySignedIn
    ? "You’re signed in"
    : mode === "register"
      ? "Create your account"
      : signInMethod === "magiclink"
        ? "Sign in with email"
        : "Welcome back";

  const subtitle = alreadySignedIn
    ? "Head back to topics anytime."
    : mode === "register"
      ? "Choose an email and password — we’ll verify your inbox."
      : signInMethod === "magiclink"
        ? "We’ll email you a one-time link. Same inbox you use here."
        : "Pick Google or email — stay aligned with what works for you.";

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="absolute left-4 top-4 sm:left-7 sm:top-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-subtle backdrop-blur-sm transition hover:border-white/20 hover:bg-black/55 hover:text-foreground"
        >
          ← Back
        </Link>
      </div>

      <div
        className={[
          "w-full max-w-[440px] rounded-2xl border border-white/10 bg-[rgba(14,14,16,0.88)] px-6 py-9 shadow-[0_28px_90px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:px-10 sm:py-10",
          "flex flex-col items-stretch text-center",
        ].join(" ")}
      >
        <div className="flex flex-col items-center gap-3">
          <AppLogo heightPx={72} priority className="drop-shadow-md" />
          <div className="space-y-1.5">
            <h1 className="font-display text-[1.65rem] font-bold tracking-tight text-foreground sm:text-[1.85rem]">
              {headline}
            </h1>
            <p className="mx-auto max-w-[320px] text-sm leading-relaxed text-subtle">{subtitle}</p>
          </div>
        </div>

        {!alreadySignedIn ? (
          <p className="mx-auto mt-5 max-w-[360px] text-left text-[11px] leading-relaxed text-subtle/90">
            {APP_DISCLAIMER}
          </p>
        ) : null}

        {alreadySignedIn ? (
          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/topics"
              className="inline-flex w-full max-w-[280px] items-center justify-center rounded-xl bg-gradient-to-r from-[#6366f1] to-[#2563eb] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/35 transition hover:brightness-[1.06]"
            >
              Go to app →
            </Link>
          </div>
        ) : (
          <>
            {networkOrigin ? (
              <div className="mt-6 w-full rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-left text-xs leading-relaxed text-amber-100">
                <p className="font-semibold text-amber-50">Network host ({networkOrigin})</p>
                <p className="mt-1 text-amber-100/90">
                  Use this origin for `NEXT_PUBLIC_APP_URL` while testing on your network:{" "}
                  <code className="font-mono text-white">{`${networkOrigin}/**`}</code>
                </p>
              </div>
            ) : null}

            <div className="mt-6 w-full space-y-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-subtle">
                Before you continue
              </p>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-black/25 px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-violet-500"
                />
                <span className="text-foreground/95">
                  I agree to the{" "}
                  <LegalDocLink href={TERMS_OF_SERVICE_PATH}>Terms of Service</LegalDocLink>.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-black/25 px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-violet-500"
                />
                <span className="text-foreground/95">
                  I agree to the{" "}
                  <LegalDocLink href={PRIVACY_POLICY_PATH}>Privacy Policy</LegalDocLink>.
                </span>
              </label>
            </div>

            {authFailed ? (
              <p className="mt-5 w-full rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-left text-xs text-danger-text">
                Sign-in failed. Please try again.
              </p>
            ) : null}

            {legalRequired ? (
              <p className="mt-5 w-full rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-left text-xs text-danger-text">
                Accept the Terms of Service and Privacy Policy before signing in.
              </p>
            ) : null}

            {formError ? (
              <p className="mt-5 w-full rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-left text-xs text-danger-text">
                {formError}
              </p>
            ) : null}

            {formSuccess ? (
              <p className="mt-5 w-full rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-left text-xs text-emerald-100">
                {formSuccess}
              </p>
            ) : null}

            {configured && backend ? (
              <div className="mt-8 flex w-full flex-col gap-6">
                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  disabled={!canSubmit || busy || !authReady}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3.5 text-sm font-semibold text-neutral-900 shadow-md transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <GoogleMark />
                  {!authReady ? "Loading…" : busy ? "Redirecting…" : "Continue with Google"}
                </button>

                <OrDivider />

                <SegmentedTabs
                  value={mode}
                  onChange={(next) => {
                    setMode(next);
                    resetMessages();
                  }}
                  options={
                    [
                      { id: "login" as const, label: "Sign in" },
                      { id: "register" as const, label: "Create account" },
                    ] as const
                  }
                />

                {mode === "login" ? (
                  <>
                    <div className="space-y-4">
                      <SegmentedTabs
                        value={signInMethod}
                        onChange={(next) => {
                          setSignInMethod(next);
                          resetMessages();
                        }}
                        options={
                          [
                            { id: "password" as const, label: "Password" },
                            { id: "magiclink" as const, label: "Magic link" },
                          ] as const
                        }
                      />

                      {signInMethod === "password" ? (
                        <form
                          onSubmit={(e) => void handleEmailLogin(e)}
                          className="flex w-full flex-col gap-4 text-left"
                        >
                          <label className="block w-full space-y-2">
                            <span className="text-xs font-medium tracking-wide text-subtle">
                              Email
                            </span>
                            <input
                              type="email"
                              autoComplete="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              className={FIELD_SHELL}
                            />
                          </label>
                          <PasswordField
                            id="login-password"
                            label="Password"
                            value={password}
                            onChange={setPassword}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                          />
                          <button
                            type="submit"
                            disabled={!canSubmit || busy}
                            className={BTN_GRADIENT}
                          >
                            {busy ? "Signing in…" : "Sign in"}
                          </button>
                          <div className="text-center">
                            <button
                              type="button"
                              disabled={!email.trim() || resendBusy}
                              onClick={() => void handleResendConfirmation()}
                              className="text-xs font-semibold text-violet-400 underline-offset-4 hover:text-violet-300 hover:underline disabled:cursor-not-allowed disabled:opacity-45 disabled:no-underline"
                            >
                              {resendBusy ? "Sending…" : "Resend confirmation email"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <form
                          onSubmit={(e) => void handleMagicLink(e)}
                          className="flex w-full flex-col gap-4 text-left"
                        >
                          <label className="block w-full space-y-2">
                            <span className="text-xs font-medium tracking-wide text-subtle">
                              Email
                            </span>
                            <input
                              type="email"
                              autoComplete="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Enter your email"
                              className={FIELD_SHELL}
                            />
                          </label>
                          <button
                            type="submit"
                            disabled={!canSubmit || busy}
                            className={BTN_GRADIENT}
                          >
                            {busy ? "Sending…" : "Email me a link"}
                          </button>
                        </form>
                      )}
                    </div>
                  </>
                ) : (
                  <form
                    onSubmit={(e) => void handleEmailRegister(e)}
                    className="flex w-full flex-col gap-4 text-left"
                  >
                    <label className="block w-full space-y-2">
                      <span className="text-xs font-medium tracking-wide text-subtle">Email</span>
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={FIELD_SHELL}
                      />
                    </label>
                    <PasswordField
                      id="register-password"
                      label="Password"
                      value={password}
                      onChange={setPassword}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />
                    <PasswordField
                      id="register-password-confirm"
                      label="Confirm password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                    />
                    <button type="submit" disabled={!canSubmit || busy} className={BTN_GRADIENT}>
                      {busy ? "Creating account…" : "Create account"}
                    </button>
                  </form>
                )}

                {!canSubmit ? (
                  <p className="text-center text-xs text-subtle">
                    Accept Terms and Privacy above to enable sign-in options.
                  </p>
                ) : null}

                <p className="text-center text-sm text-subtle">
                  {mode === "login" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        className="font-bold text-violet-400 hover:text-violet-300 hover:underline"
                        onClick={() => {
                          setMode("register");
                          resetMessages();
                        }}
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="font-bold text-violet-400 hover:text-violet-300 hover:underline"
                        onClick={() => {
                          setMode("login");
                          resetMessages();
                        }}
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <p className="mt-8 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-left text-xs text-danger-text">
                Add MongoDB auth environment variables to enable sign-in.
              </p>
            )}
          </>
        )}

        <div className="mt-10 border-t border-white/5 pt-6">
          <LegalFooterLinks centered className="justify-center gap-x-6" />
        </div>
      </div>
    </div>
  );
}
