// Small stand-ins for the DAX helpers the measures lean on. Formatting
// follows the report language: en-US like the measures' FORMAT ( ...,
// "en-US" ) calls, or fr-CA. Builders run synchronously inside withLang.

import type { Lang } from "@/app/lib/i18n/config";

export type N = number | null;

const NBSP = "\u00a0";
let LANG: Lang = "en";
let LOCALE = "en-US";

export function withLang<T>(lang: Lang, build: () => T): T {
  const prev = LANG;
  LANG = lang;
  LOCALE = lang === "fr" ? "fr-CA" : "en-US";
  try {
    return build();
  } finally {
    LANG = prev;
    LOCALE = prev === "fr" ? "fr-CA" : "en-US";
  }
}

export const currentLang = () => LANG;

// DAX rounds half away from zero; Math.round rounds half up
export function dround(x: number, dp = 0) {
  const f = Math.pow(10, dp);
  return (Math.sign(x) * Math.round(Math.abs(x) * f)) / f;
}

// DIVIDE: blank (null) when the denominator is zero or blank
export function divide(a: N, b: N): N {
  if (a === null || b === null || b === 0) return null;
  return a / b;
}

// FORMAT ( x, "#,0" )
export function int(x: N) {
  if (x === null) return "";
  return dround(x).toLocaleString(LOCALE, { maximumFractionDigits: 0 });
}

// FORMAT ( x, "#,0.00" ) and friends
export function dec(x: N, dp: number, grouping = true) {
  if (x === null) return "";
  return dround(x, dp).toLocaleString(LOCALE, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
    useGrouping: grouping,
  });
}

// FORMAT ( x, "0.0%" ) / "0%"
export function pct(x: N, dp = 1) {
  if (x === null) return "";
  return dec(x * 100, dp, false) + (LANG === "fr" ? NBSP : "") + "%";
}

// FORMAT ( x, "+0.0%;-0.0%" ) / "+0%;-0%"
export function spct(x: N, dp = 1) {
  if (x === null) return "";
  const body = dec(Math.abs(x) * 100, dp, false) + (LANG === "fr" ? NBSP : "") + "%";
  return (x < 0 ? "-" : "+") + body;
}

// numbers that go into CSS, which never takes a decimal comma
export function cssNum(x: number, dp = 1) {
  return String(dround(x, dp));
}

// "$#,##0" / "$#,##0.00": $1,234 or 1 234 $
export function money(x: N, dp = 0) {
  if (x === null) return "";
  if (LANG === "fr") return dec(x, dp) + NBSP + "$";
  return (x < 0 ? "-$" : "$") + dec(Math.abs(x), dp);
}

// 1.25M / 1,25 M, and $1.25M / 1,25 M$ with money
export function short(x: number, unit: "K" | "M", dp: number, isMoney = false) {
  const v = dec(x / (unit === "M" ? 1_000_000 : 1000), dp);
  if (LANG === "fr") return v + NBSP + (unit === "M" ? "M" : "k") + (isMoney ? "$" : "");
  return (isMoney ? "$" : "") + v + unit;
}

// SUBSTITUTE chains used to keep names from breaking the markup
export function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&#39;");
}

export function ordinal(n: number) {
  if (LANG === "fr") return n === 1 ? "er" : "e";
  if ([11, 12, 13].includes(n % 100)) return "th";
  if (n % 10 === 1) return "st";
  if (n % 10 === 2) return "nd";
  if (n % 10 === 3) return "rd";
  return "th";
}

export function sum<T>(xs: T[], f: (x: T) => number) {
  let s = 0;
  for (const x of xs) s += f(x);
  return s;
}

export function groupBy<T>(xs: T[], key: (x: T) => string) {
  const m = new Map<string, T[]>();
  for (const x of xs) {
    const k = key(x);
    const arr = m.get(k);
    if (arr) arr.push(x);
    else m.set(k, [x]);
  }
  return m;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juill.", "août", "sept.", "oct.", "nov.", "déc."];

// FORMAT ( d, "MMM d, yyyy" ), or "d MMM yyyy" in French
export function mdy(d: Date) {
  if (LANG === "fr") return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// [Date Insertion] is text: ISO for recent listings, a bucket label otherwise
export function parseInsertion(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
