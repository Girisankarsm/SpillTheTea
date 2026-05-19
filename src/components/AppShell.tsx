import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";
import { AuthMenu } from "@/components/AuthMenu";
import { HeaderSpacer } from "@/components/HeaderSpacer";
import { InstallBanner } from "@/components/InstallBanner";
import { LegalFooterLinks } from "@/components/LegalFooterLinks";
import { MainNav } from "@/components/MainNav";
import { PushNotificationManager, PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { SetupBanner } from "@/components/SetupBanner";

export { AppLogo } from "@/components/AppLogo";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        id="app-site-header"
        className="fixed inset-x-0 top-0 z-[500] border-b border-border bg-surface shadow-sm"
      >
        <InstallBanner />
        <PushNotificationPrompt />
        <PushNotificationManager />
        <SetupBanner />
        <header className="mx-auto max-w-6xl px-3 sm:px-4">
          <div className="flex h-12 items-center justify-between gap-3 sm:h-14">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 text-[17px] font-semibold tracking-tight text-foreground"
            >
              <AppLogo heightPx={32} priority className="sm:h-9 sm:w-9" />
              <span className="hidden truncate sm:inline">SpillTheTea</span>
            </Link>

            <MainNav variant="desktop" />

            <AuthMenu />
          </div>

          <MainNav variant="mobile" />
        </header>
      </div>
      <HeaderSpacer />
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-border bg-surface py-6">
        <LegalFooterLinks centered className="mx-auto max-w-6xl px-4" />
      </footer>
    </>
  );
}
