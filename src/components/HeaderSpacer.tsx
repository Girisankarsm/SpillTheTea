"use client";

import { useEffect, useState } from "react";

/** Matches fixed header height so page content starts below it. */
export function HeaderSpacer() {
  const [height, setHeight] = useState(56);

  useEffect(() => {
    const el = document.getElementById("app-site-header");
    if (!el) return;

    const update = () => setHeight(el.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div aria-hidden className="shrink-0" style={{ height }} />;
}
