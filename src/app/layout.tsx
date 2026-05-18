import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { AppShellOrPlain } from "@/components/AppShellOrPlain";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "SpillTheTea — Anonymous Convo Rooms",
  description:
    "Open anonymous chat rooms about any topic. Pick a nickname, join the conversation, and talk with people who showed up for the same tea.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SpillTheTea",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2d6a4f" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <SupabaseProvider>
          <AppShellOrPlain>{children}</AppShellOrPlain>
        </SupabaseProvider>
      </body>
    </html>
  );
}
