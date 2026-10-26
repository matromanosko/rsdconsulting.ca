"use client";

import { ReactNode, useEffect, useState } from "react";
import { useDict } from "@/app/lib/i18n/LangProvider";

// "Book a call" buttons open Calendly's booking page in a dialog over the
// current page instead of navigating away. Styling comes from the caller.

export const CALENDLY_URL = "https://calendly.com/mathis-skobinsky/30min";

function BookCallDialog({ onClose }: { onClose: () => void }) {
  const t = useDict().booking;
  // only mounted after a click, so window is always there
  const src = `${CALENDLY_URL}?hide_gdpr_banner=1&embed_type=Inline&embed_domain=${window.location.host}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-3 backdrop-blur-[3px] sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className="relative flex h-[min(720px,92dvh)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_25px_60px_rgba(0,0,0,0.3)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
          <p className="font-display text-base font-medium tracking-tight">{t.title}</p>
          <div className="flex items-center gap-3">
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="hidden text-xs text-muted hover:text-foreground sm:block">
              {t.openCalendly}
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              autoFocus
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-muted hover:bg-band hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="relative flex-1 bg-surface">
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">{t.loading}</p>
          <iframe src={src} title="Calendly booking" className="relative h-full w-full border-0" />
        </div>
      </div>
    </div>
  );
}

export default function BookCallButton({ className, children }: { className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && <BookCallDialog onClose={() => setOpen(false)} />}
    </>
  );
}
