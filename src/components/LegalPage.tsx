import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";
import {
  APP_NAME,
  LEGAL_LAST_UPDATED,
  PRIVACY_POLICY_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/lib/legal";
import { LegalFooterLinks } from "@/components/LegalFooterLinks";

type LegalPageProps = {
  title: string;
  summary: string;
  children: React.ReactNode;
};

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-subtle [&_a]:font-semibold [&_a]:text-brand [&_a]:hover:underline [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}

export function LegalPage({ title, summary, children }: LegalPageProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="border-b border-border bg-[rgba(7,9,15,0.75)] backdrop-blur-[28px]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AppLogo heightPx={28} />
            <span className="hidden sm:inline">{APP_NAME}</span>
          </Link>
          <LegalFooterLinks />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <header className="glass-card-strong rounded-[22px] border-brand-border p-6 sm:p-8">
          <p className="text-xs font-bold tracking-widest text-brand-bright uppercase">Legal</p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-subtle">{summary}</p>
          <p className="mt-4 text-xs text-subtle">Last updated {LEGAL_LAST_UPDATED}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={TERMS_OF_SERVICE_PATH}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:border-brand hover:text-brand"
            >
              Terms of Service
            </Link>
            <Link
              href={PRIVACY_POLICY_PATH}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:border-brand hover:text-brand"
            >
              Privacy Policy
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        </header>

        <article className="mt-6 space-y-4">{children}</article>

        <footer className="mt-10 border-t border-border pt-6">
          <LegalFooterLinks centered />
        </footer>
      </div>
    </div>
  );
}
