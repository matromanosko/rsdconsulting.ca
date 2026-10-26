"use server";

import { cookies } from "next/headers";
import { LANG_COOKIE, isLang } from "./config";

// Saves the language toggle. Setting the cookie re-renders the current page
// in the new language.
export async function setLang(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
