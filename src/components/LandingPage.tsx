import Link from "next/link";
import { LandingAuthLink } from "@/components/LandingAuthLink";
import { LegalFooterLinks } from "@/components/LegalFooterLinks";

const features = [
  {
    icon: "🍵",
    title: "Anonymous Tea",
    text: "Post topics and replies under a name you choose — your email stays private.",
  },
  {
    icon: "⚡",
    title: "Zero friction",
    text: "Sign in with email, pick a display name, and start talking in seconds.",
  },
  {
    icon: "🛡️",
    title: "Local & private",
    text: "UPI and phone only show after a duty or ride match. Chat stays between you.",
  },
  {
    icon: "📍",
    title: "Hyperlocal map",
    text: "See tea hotspots and open rides near you on the map.",
  },
] as const;

const steps = [
  { n: "01", title: "Sign in", text: "Email login + accept Terms & Privacy." },
  { n: "02", title: "Talk or task", text: "Post tea, duties, or rides near you." },
  { n: "03", title: "Connect", text: "Reply, DM, call, or meet when matched." },
] as const;

const faqs = [
  {
    q: "What is SpillTheTea?",
    a: "A hyperlocal app for anonymous topics (Tea), paid duties, ride pooling, and private chat near you.",
  },
  {
    q: "Is my email public?",
    a: "No. Others see your anonymous display name and optional photo — not your email address.",
  },
  {
    q: "How do payments work?",
    a: "Duties and rides are arranged between users. UPI or phone is shared only after you match.",
  },
  {
    q: "Do I need to share location?",
    a: "Optional. Location pins your tea on the map and shows nearby rides within 15 km.",
  },
] as const;

function NavPill({
  href,
  children,
  highlight,
}: {
  href: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-4 py-2 text-sm font-medium transition",
        highlight
          ? "border border-white/20 text-foreground hover:bg-surface"
          : "text-subtle hover:bg-surface hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-dvh text-foreground">
      <nav className="sticky top-0 z-[100] border-b border-border bg-[rgba(8,8,8,0.85)] backdrop-blur-[28px]">
        <div className="mx-auto flex h-[58px] max-w-[1100px] items-center gap-4 px-4 sm:px-7">
          <Link href="/" className="font-display flex shrink-0 items-center gap-2 text-[17px] font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-[15px] shadow-[0_0_18px_rgba(255,255,255,0.25)]">
              🍵
            </span>
            <span className="hidden sm:inline">SpillTheTea</span>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
            <NavPill href="#process">Process</NavPill>
            <NavPill href="#faq">FAQ</NavPill>
            <NavPill href="#map" highlight>
              See map
            </NavPill>
          </div>

          <LandingAuthLink
            className="relative z-[101] ml-auto rounded-full bg-white px-5 py-2 text-sm font-semibold text-black shadow-[0_2px_14px_rgba(255,255,255,0.18)] transition hover:bg-[#e8e8e8]"
          >
            Sign in
          </LandingAuthLink>
        </div>
      </nav>

      <main className="mx-auto max-w-[1100px] px-4 pb-16 sm:px-7">
        {/* Hero */}
        <section className="grid items-center gap-12 py-16 lg:grid-cols-[1fr_340px] lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.13] px-3 py-1.5 text-xs font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Live on your campus
            </div>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Talk. <span className="text-white/95">Task.</span>
              <br />
              <span className="font-serif-accent italic">Ride near you.</span>
            </h1>
            <p className="mt-5 max-w-md text-base font-light leading-relaxed text-subtle">
              Connect skills with opportunities in your neighborhood — anonymous tea,
              paid duties, ride pooling, and private chat.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LandingAuthLink className="btn-primary-glow rounded-full px-7 py-3 text-sm">
                Get started →
              </LandingAuthLink>
              <Link
                href="#process"
                className="rounded-full border border-border bg-surface px-6 py-3 text-sm text-foreground transition hover:bg-surface-hover"
              >
                How it works
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 top-4 left-4 -right-4 -z-10 rounded-[22px] border border-white/6 bg-white/[0.025]" />
            <article className="glass-card-strong animate-float-card rounded-[22px] p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                    MK
                  </div>
                  <div>
                    <p className="text-sm font-medium">Maya K.</p>
                    <p className="text-[11px] text-subtle/60">📍 0.4 km · 2 min ago</p>
                  </div>
                </div>
                <span className="rounded-full border border-white/18 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/75">
                  Tea
                </span>
              </div>
              <p className="text-sm leading-relaxed text-subtle">
                Anyone know why the signal near campus is so bad lately?
              </p>
              <div className="mt-4 flex gap-3 border-t border-border pt-3 text-xs text-subtle/60">
                <span>💬 12 replies</span>
                <span>🔥 34</span>
                <span className="ml-auto">DM →</span>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                <p className="text-xs text-subtle">🔒 Sign in to access campus tea &amp; rides</p>
                <LandingAuthLink className="mt-2 inline-block text-xs font-semibold text-white hover:underline">
                  Sign in →
                </LandingAuthLink>
              </div>
            </article>
          </div>
        </section>

        {/* Two cards */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="glass-card rounded-[22px] p-6 sm:p-8">
            <span className="rounded-full border border-white/14 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/70">
              Tea &amp; Duties
            </span>
            <div className="mt-6 text-5xl">🍵</div>
            <h2 className="font-display mt-4 text-xl font-semibold">Build &amp; earn</h2>
            <p className="mt-2 text-sm leading-relaxed text-subtle">
              Post anonymous tea or take paid duties from people near you.
            </p>
          </div>
          <div className="glass-card rounded-[22px] p-6 sm:p-8">
            <span className="rounded-full border border-white/14 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/70">
              Rides
            </span>
            <div className="mt-6 text-5xl">🚗</div>
            <h2 className="font-display mt-4 text-xl font-semibold">Share rides</h2>
            <p className="mt-2 text-sm leading-relaxed text-subtle">
              Post pickup → drop, get offers, track live, and chat or call.
            </p>
          </div>
        </section>

        {/* Why */}
        <section className="py-20">
          <h2 className="font-display text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Why SpillTheTea?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-subtle">
            Built for speed, trust, and hyperlocal community.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-lg">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-subtle">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Map teaser */}
        <section id="map" className="scroll-mt-24 py-8">
          <div className="glass-card-strong rounded-[28px] p-8 sm:p-10">
            <p className="text-xs font-medium tracking-[0.12em] text-subtle uppercase">For your area</p>
            <h2 className="font-display mt-2 text-2xl font-semibold sm:text-3xl">
              See what&apos;s happening near you
            </h2>
            <p className="mt-3 max-w-xl text-sm text-subtle">
              Tea hotspots and open rides on a live map — within 15 km when you allow location.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Verified sign-in", "Anonymous name", "Fast local feed"].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-subtle">
                  ✓ {item}
                </div>
              ))}
            </div>
            <LandingAuthLink className="btn-primary-glow mt-8 inline-flex rounded-full px-6 py-3 text-sm">
              Open the map →
            </LandingAuthLink>
          </div>
        </section>

        {/* Process */}
        <section id="process" className="scroll-mt-24 py-20">
          <h2 className="font-display text-center text-3xl font-semibold">Simple flow</h2>
          <div className="relative mt-12 grid gap-8 sm:grid-cols-3">
            <div className="absolute top-8 right-[16%] left-[16%] hidden h-px bg-white/15 sm:block" />
            {steps.map((step) => (
              <div key={step.n} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] font-display text-lg font-semibold shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                  {step.n}
                </div>
                <h3 className="mt-5 text-sm font-semibold">{step.title}</h3>
                <p className="mt-2 text-xs text-subtle">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-24 py-12">
          <h2 className="font-display text-center text-3xl font-semibold">Common questions</h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-2">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group glass-card rounded-2xl px-5 py-4 open:bg-surface-hover"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-subtle transition group-open:rotate-180">▾</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-subtle">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-[30px] border border-white/16 bg-white/[0.055] p-8 sm:p-10">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Ready to connect with your neighborhood?
          </h2>
          <p className="mt-2 max-w-lg text-sm text-subtle">
            Sign in with Google — anonymous name, private email, local tea on the map.
          </p>
          <LandingAuthLink className="btn-primary-glow mt-6 inline-flex rounded-full px-8 py-3.5 text-[15px]">
            Sign in with Google →
          </LandingAuthLink>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <LegalFooterLinks centered className="mx-auto max-w-[1100px] px-4" />
      </footer>
    </div>
  );
}
