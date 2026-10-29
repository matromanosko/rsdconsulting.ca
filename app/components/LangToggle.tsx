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

  const on = variant === "dark" ? "text-white" : "text-foreground";
  const off = variant === "dark" ? "text-white/60 hover:text-white" : "text-muted hover:text-foreground";

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={`flex shrink-0 items-center gap-1.5 text-xs font-semibold ${pending ? "opacity-60" : ""}`}
    >
      {LANGS.map((l, i) => [
        i > 0 && (
          <span key={`sep-${l}`} aria-hidden className={`hidden sm:block ${variant === "dark" ? "text-white/60" : "text-muted"}`}>
            /
          </span>
        ),
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === lang}
          title={t.toggle[l]}
          disabled={pending}
          onClick={() => l !== lang && startTransition(() => setLang(l))}
          className={`py-1 uppercase transition-colors ${l === lang ? `hidden cursor-default sm:block ${on}` : `cursor-pointer ${off}`}`}
        >
          {l}
        </button>,
      ])}
    </div>
  );
}
