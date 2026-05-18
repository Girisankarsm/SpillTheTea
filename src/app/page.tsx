import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";

const features = [
  {
    id: "tea",
    emoji: "🍵",
    title: "Tea",
    flow: "Pick a topic → post anonymously → discuss in replies (like Reddit) → DM someone from a post",
    href: "/topics",
  },
  {
    id: "duties",
    emoji: "🤝",
    title: "Duties",
    flow: "Post a small favor → helpers offer a reward → pick one → chat → pay via UPI/cash",
    href: "/duties",
  },
  {
    id: "rides",
    emoji: "🚗",
    title: "Ride pooling",
    flow: "Post pickup & drop → drivers offer → pick a driver → share live location → chat or call",
    href: "/rides",
  },
  {
    id: "map",
    emoji: "🗺️",
    title: "Map",
    flow: "See open topics near you on the map",
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
        <p className="text-sm leading-relaxed text-subtle">
          Anonymous posts and discussions under topics — plus duties, ride pooling, and
          private chat.
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        <Link
          href="/topics"
          className="rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          Browse Tea
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
          Start a topic
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
                <p className="text-sm font-bold text-foreground">
                  <span aria-hidden>{feature.emoji} </span>
                  {feature.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-subtle">{feature.flow}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-center text-[11px] text-subtle">
          Rewards for duties and rides are recorded in the app — you pay the person directly
          (UPI/cash).
        </p>
      </div>
    </div>
  );
}
