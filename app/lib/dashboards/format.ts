// Small stand-ins for the DAX helpers the measures lean on. Everything is
// formatted en-US, like the measures' FORMAT ( ..., "en-US" ) calls.

export type N = number | null;

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
  return dround(x).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// FORMAT ( x, "#,0.00" ) and friends
export function dec(x: N, dp: number, grouping = true) {
  if (x === null) return "";
  return dround(x, dp).toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
    useGrouping: grouping,
  });
}

// FORMAT ( x, "0.0%" ) / "0%"
export function pct(x: N, dp = 1) {
  if (x === null) return "";
  return dec(x * 100, dp, false) + "%";
}

// FORMAT ( x, "+0.0%;-0.0%" ) / "+0%;-0%"
export function spct(x: N, dp = 1) {
  if (x === null) return "";
  const body = dec(Math.abs(x) * 100, dp, false) + "%";
  return (x < 0 ? "-" : "+") + body;
}

// SUBSTITUTE chains used to keep names from breaking the markup
export function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&#39;");
}

export function ordinal(n: number) {
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

// FORMAT ( d, "MMM d, yyyy" )
export function mdy(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// [Date Insertion] is text: ISO for recent listings, a bucket label otherwise
export function parseInsertion(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
