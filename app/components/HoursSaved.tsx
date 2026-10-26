"use client";

import { useEffect, useRef, useState } from "react";
import { useDict } from "@/app/lib/i18n/LangProvider";

// Hero stat: counts 0 → TARGET once it scrolls into view. Skips the
// animation for visitors who prefer reduced motion.

const TARGET = 200;
const DURATION = 1600;

export default function HoursSaved() {
  const label = useDict().hero.hoursSaved;
  const ref = useRef<HTMLParagraphElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(() => setValue(TARGET));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / DURATION, 1);
        setValue(Math.round(TARGET * (1 - (1 - t) ** 3))); // ease-out cubic
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <p ref={ref} className="flex items-baseline gap-2">
      <span className="sr-only">{`${TARGET} ${label}`}</span>
      <span className="font-display text-4xl font-medium tabular-nums tracking-tight text-accent" aria-hidden>
        {value}
      </span>
      <span className="whitespace-nowrap text-sm font-medium" aria-hidden>
        {label}
      </span>
    </p>
  );
}
