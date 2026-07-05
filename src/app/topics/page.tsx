"use client";

import { Suspense } from "react";
import { HomeDashboard } from "@/components/HomeDashboard";

function HomePageFallback() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton mt-4 h-24 w-full" />
    </div>
  );
}

export default function TopicsDirectoryPage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomeDashboard />
    </Suspense>
  );
}
