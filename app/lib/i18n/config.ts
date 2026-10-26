// Site languages. The choice lives in LANG_COOKIE; without it, the
// visitor's Accept-Language decides. Safe to import from client code.

export const LANGS = ["en", "fr"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "lang";

export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);
