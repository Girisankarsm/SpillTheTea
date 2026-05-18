import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { AppShell } from "@/components/AppShell";
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
          <AppShell>{children}</AppShell>
        </SupabaseProvider>
      </body>
    </html>
  );
}
