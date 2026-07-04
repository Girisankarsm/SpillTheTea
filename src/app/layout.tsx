import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { AppAmbientBackground } from "@/components/AppAmbientBackground";
import { AppShellOrPlain } from "@/components/AppShellOrPlain";
import { BackendProvider } from "@/components/BackendProvider";
import { VoiceCallProvider } from "@/components/VoiceCallProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const instrumentSerif = Inter({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "SpillTheTea — Anonymous Topics & Discussions",
  description:
    "Talk, task, and ride near you. Anonymous Tea, duties, ride pooling, and private chat in your neighborhood.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SpillTheTea",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full min-w-0 flex-col overflow-x-hidden bg-background font-sans text-foreground">
        <AppAmbientBackground />
        <BackendProvider>
          <VoiceCallProvider>
            <div className="relative z-[1] flex min-h-full flex-1 flex-col">
              <AppShellOrPlain>{children}</AppShellOrPlain>
            </div>
          </VoiceCallProvider>
        </BackendProvider>
      </body>
    </html>
  );
}
