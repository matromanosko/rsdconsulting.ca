import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from "./config";

// The visitor's language: their saved choice, else whichever of en / fr
// Accept-Language rates highest (first listed wins a tie), else English.
export async function getLang(): Promise<Lang> {
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(saved)) return saved;
  return preferredLang((await headers()).get("accept-language") ?? "");
}

export function preferredLang(accept: string): Lang {
  let best: Lang = DEFAULT_LANG;
  let bestQ = 0;
  for (const part of accept.split(",")) {
    const [tag, ...params] = part.split(";");
    const code = tag.trim().slice(0, 2).toLowerCase();
    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const q = qParam ? Number(qParam.slice(2)) : 1;
    if (isLang(code) && q > bestQ) {
      best = code;
      bestQ = q;
    }
  }
  return best;
}
