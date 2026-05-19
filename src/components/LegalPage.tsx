import Link from "next/link";
import { APP_NAME, LEGAL_LAST_UPDATED } from "@/lib/legal";
import { LegalFooterLinks } from "@/components/LegalFooterLinks";

type LegalPageProps = {
  title: string;
  children: React.ReactNode;
};

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <Link href="/" className="text-sm font-semibold text-brand hover:underline">
          ← Home
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-xs text-subtle">
          {APP_NAME} · Last updated {LEGAL_LAST_UPDATED}
        </p>
      </header>

      <article className="space-y-6 text-sm leading-relaxed text-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </article>

      <LegalFooterLinks className="border-t border-border pt-6" />
    </div>
  );
}
