"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LANG, type Lang } from "./config";
import { dict } from "./dictionaries";

// Hands the server's language choice to client components.

const LangContext = createContext<Lang>(DEFAULT_LANG);

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
export const useDict = () => dict(useLang());
