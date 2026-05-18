import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";

const steps = [
  { n: "1", label: "Open a room", detail: "Browse or start one." },
  { n: "2", label: "Post", detail: "Text, reply, or drop a GIF." },
  { n: "3", label: "Chat", detail: "Anonymous. Your rules." },
] as const;

export default function Home() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-lg flex-col items-center justify-center gap-8 px-4 py-10 text-center sm:gap-10 sm:py-16">
      <div className="space-y-4">
        <div className="mx-auto">
          <AppLogo heightPx={180} priority className="shadow-md" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          SpillTheTea
        </h1>
        <p className="text-sm text-subtle">Anonymous convo rooms. That&apos;s it.</p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        <Link
          href="/topics"
          className="rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          Browse rooms
        </Link>
        <Link
          href="/duties"
          className="rounded-lg border border-border bg-surface px-5 py-3 text-sm font-bold text-foreground hover:bg-brand-soft"
        >
          Duties
        </Link>
        <Link
          href="/rides"
          className="rounded-lg border border-border bg-surface px-5 py-3 text-sm font-bold text-foreground hover:bg-brand-soft"
        >
          Ride pooling
        </Link>
        <Link
          href="/topics"
          className="rounded-lg border border-border bg-surface px-5 py-3 text-sm font-bold text-foreground hover:bg-brand-soft"
        >
          Start a room
        </Link>
      </div>

      <div className="w-full space-y-3 border-t border-border pt-8">
        <p className="text-xs font-bold uppercase tracking-wide text-subtle">
          How it works
        </p>
        <ol className="grid gap-4 sm:grid-cols-3 sm:gap-3">
          {steps.map((step) => (
            <li key={step.n} className="flex flex-col items-center gap-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                {step.n}
              </span>
              <span className="text-sm font-bold text-foreground">{step.label}</span>
              <span className="text-xs text-subtle">{step.detail}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
