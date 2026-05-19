import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";

const features = [
  {
    id: "tea",
    title: "Tea",
    flow: "1. Topic → 2. Post → 3. Reply → 4. DM",
    href: "/topics",
  },
  {
    id: "duties",
    title: "Duties",
    flow: "1. Favor → 2. Offers → 3. Pick → 4. Pay",
    href: "/duties",
  },
  {
    id: "rides",
    title: "Ride pooling",
    flow: "1. Route → 2. Offers → 3. Pick → 4. Track → 5. Chat",
    href: "/rides",
  },
  {
    id: "map",
    title: "Map",
    flow: "1. Map → 2. Nearby topics",
    href: "/explore",
  },
] as const;

export default function Home() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-lg flex-col items-center justify-center gap-8 px-4 py-10 text-center sm:max-w-2xl sm:gap-10 sm:py-16">
      <div className="space-y-4">
        <div className="mx-auto">
          <AppLogo heightPx={180} priority className="shadow-md" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          SpillTheTea
        </h1>
        <p className="text-sm text-subtle">
          Talk, task, and ride near you.
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        <Link
          href="/topics"
          className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white hover:opacity-90 sm:w-auto"
        >
          Browse Tea
        </Link>
        <Link
          href="/duties"
          className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-bold text-foreground hover:bg-brand-soft sm:w-auto"
        >
          Duties
        </Link>
        <Link
          href="/rides"
          className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-bold text-foreground hover:bg-brand-soft sm:w-auto"
        >
          Ride pooling
        </Link>
      </div>

      <div className="w-full space-y-4 border-t border-border pt-8 text-left">
        <p className="text-center text-xs font-bold uppercase tracking-wide text-subtle">
          How it works
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature.id}>
              <Link
                href={feature.href}
                className="block rounded-xl border border-border bg-surface p-4 transition hover:border-brand/40 hover:bg-brand-soft/30"
              >
                <p className="text-sm font-bold text-foreground">{feature.title}</p>
                <p className="mt-1 text-xs text-subtle">{feature.flow}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
