"use client";

import { useTransition } from "react";
import { LANGS } from "@/app/lib/i18n/config";
import { setLang } from "@/app/lib/i18n/actions";
import { useDict, useLang } from "@/app/lib/i18n/LangProvider";

// EN / FR switch. Saving the choice re-renders the page in that language.
// Below sm only the other language shows, to leave the header room.
export default function LangToggle({ variant = "light" }: { variant?: "light" | "dark" }) {
  const lang = useLang();
  const t = useDict();
  const [pending, startTransition] = useTransition();

  const shell = variant === "dark" ? "bg-white/10" : "bg-band";
  const on = variant === "dark" ? "bg-white text-[#252423]" : "bg-surface text-foreground shadow-sm";
  const off = variant === "dark" ? "text-white/70 hover:text-white" : "text-muted hover:text-foreground";

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={`flex shrink-0 items-center rounded-full p-0.5 text-xs font-semibold ${shell} ${pending ? "opacity-60" : ""}`}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === lang}
          title={t.toggle[l]}
          disabled={pending}
          onClick={() => l !== lang && startTransition(() => setLang(l))}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${l === lang ? `hidden sm:block ${on}` : off}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
