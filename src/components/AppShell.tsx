import Link from "next/link";
import { AuthMenu } from "@/components/AuthMenu";
import { HeaderSpacer } from "@/components/HeaderSpacer";
import { InstallBanner } from "@/components/InstallBanner";
import { LegalFooterLinks } from "@/components/LegalFooterLinks";
import { BottomNav, MainNav } from "@/components/MainNav";
import { PushNotificationManager, PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { SetupBanner } from "@/components/SetupBanner";

export { AppLogo } from "@/components/AppLogo";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        id="app-site-header"
        className="fixed inset-x-0 top-0 z-[500] border-b border-border bg-[rgba(8,8,8,0.82)] backdrop-blur-[28px] backdrop-saturate-120"
      >
        <InstallBanner />
        <PushNotificationPrompt />
        <PushNotificationManager />
        <SetupBanner />
        <header className="mx-auto max-w-[1100px] px-4 sm:px-7">
          <div className="flex h-[58px] items-center gap-4 sm:gap-8">
            <Link
              href="/topics"
              className="font-display flex shrink-0 items-center gap-2 text-[17px] font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-[15px] shadow-[0_0_18px_rgba(255,255,255,0.25)]">
                🍵
              </span>
              <span className="hidden sm:inline">SpillTheTea</span>
            </Link>

            <MainNav variant="desktop" />

            <div className="ml-auto flex items-center gap-2.5">
              <Link
                href="/topics?create=1"
                className="press-scale inline-flex rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold text-black shadow-[0_2px_14px_rgba(255,255,255,0.18)] transition hover:bg-[#e8e8e8] hover:shadow-[0_4px_22px_rgba(255,255,255,0.22)] sm:px-4"
              >
                + Post tea
              </Link>
              <AuthMenu />
            </div>
          </div>
        </header>
      </div>
      <HeaderSpacer />
      <main className="flex flex-1 flex-col pb-bottom-nav lg:pb-0">{children}</main>
      <BottomNav />
      <footer className="hidden border-t border-border bg-surface/40 py-8 backdrop-blur-sm sm:block">
        <LegalFooterLinks centered className="mx-auto max-w-[1100px] px-4" />
      </footer>
    </>
  );
}
