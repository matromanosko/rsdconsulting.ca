// Ports of the ranked HTML table measures that share one look
// (Category Suppliers / Category Brands / Top Countries / Segment Table).
// The demo fixes the columns instead of reading the selector slicers, and
// swaps only the grouping.

import type { Lang } from "@/app/lib/i18n/config";
import { Row, getRows } from "./data";
import { N, divide, int, money, pct, withLang } from "./format";
import { dash, term, type DashStrings } from "./i18n";

export type Grouping = "suppliers" | "brands" | "countries" | "segments";

type Kind = "Num" | "Pct";
type Metric = "Sales R3" | "Sales RY" | "Sales YTD" | "Sales $";

type Col = {
  col: string;
  header: string;
  sub: string;
  kind: Kind;
  metric: Metric;
  fmt: string;
  order: number;
};

// one fixed set: TY + % chg for three volume windows and sales $
const columns = (t: DashStrings["tables"]): Col[] =>
  ([
    ["Sales R3", 60],
    ["Sales YTD", 62],
    ["Sales RY", 64],
    ["Sales $", 68],
  ] as const).flatMap(([m, o], i) => [
    { col: m, header: t.columns[i], sub: t.ty, kind: "Num" as Kind, metric: m, fmt: m === "Sales $" ? "$#,##0" : "#,##0", order: o },
    { col: m, header: t.columns[i], sub: t.chg, kind: "Pct" as Kind, metric: m, fmt: "0.0%", order: o + 0.1 },
  ]);

function ty(r: Row, m: Metric): number {
  return m === "Sales R3" ? r.r3 : m === "Sales YTD" ? r.yt : m === "Sales RY" ? r.ry : r.d;
}
function lyv(r: Row, m: Metric): number {
  return m === "Sales R3" ? r.r3L : m === "Sales YTD" ? r.ytL : m === "Sales RY" ? r.ryL : r.dL;
}

function fmtNum(x: N, fmt: string) {
  if (x === null) return "";
  if (fmt === "0.0%") return pct(x);
  if (fmt === "$#,##0") return money(x);
  return int(x);
}

// one aggregated value for a column over a set of rows
function cellValue(rows: Row[], c: Col): N {
  if (!rows.length) return null;
  let t = 0;
  let l = 0;
  for (const r of rows) {
    t += ty(r, c.metric);
    l += lyv(r, c.metric);
  }
  if (c.kind === "Pct") return divide(t - l, l);
  return t;
}

function rankDesc<T>(xs: T[], v: (x: T) => number) {
  // RANKX ( ..., DESC ) with the default SKIP ties
  return (x: T) => xs.filter((o) => v(o) > v(x)).length + 1;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// ---------- shared look ----------
const FONT_CSS = 'font-family:"Segoe UI",Roboto,Arial,sans-serif;'; // double quotes: the measure's single quotes close the style attribute early
const NAVY = "#5C1A26";
const NAVY_LINE = "#74303B";
const GRID = "#E2DAD0";
const GROUP_LINE = "#ADA297";
const HIGHLIGHT = "#F2DCDF";
const UP = "#1B7F3B";
const DOWN = "#B42318";
const TOT_UP = "#86EFAC";
const TOT_DOWN = "#FCA5A5";
const MUTED = "#6B625B";

function sizing(o: {
  bodyRows: number; sepRows: number; nameChars: number; wrapLines: number; rs: number;
  cols: Col[]; nameMin: number; nameMax: number; lead: number; clamp: [number, number];
}) {
  const nameW = Math.min(Math.max(o.nameChars * 0.6 + 1.2, o.nameMin), o.nameMax);
  const colsW = o.cols.reduce(
    (s, c) => s + (c.kind === "Pct" ? 6.4 : c.fmt === "$#,##0" ? 7.8 : 6.8),
    0,
  );
  const wUnits = o.lead + nameW + colsW + 0.5;
  const hUnits = 3.4 + o.rs * 1.95 + (o.bodyRows + o.sepRows) * 1.95 + o.wrapLines * 1.3 + 0.5;
  // the measure's em estimates run ~25% large for this font, so the demo
  // scales them back to let the table fill its frame
  const FIT = 1.22;
  const fitH = `calc((100vh - 2vh) * ${FIT} / ${hUnits.toFixed(2)})`;
  const fitW = `calc((100vw - 2vw) * ${FIT} / ${wUnits.toFixed(2)})`;
  const font = `clamp(${o.clamp[0]}px, min(${fitH}, ${fitW}), ${o.clamp[1]}px)`;
  return { font, title: `calc(${font} * 1.3)`, small: `calc(${font} * 0.88)` };
}

type Styles = { th: string; td: string; tdTot: string; pad: string };
function styles(font: string, pad: string): Styles {
  const f = `font-size:${font};line-height:1.15;font-variant-numeric:tabular-nums;`;
  return {
    pad,
    th: `${pad}${f}font-weight:700;color:#FFFFFF;background:${NAVY};border:1px solid ${NAVY_LINE};text-align:center;white-space:normal;vertical-align:middle;`,
    td: `${pad}${f}border:1px solid ${GRID};white-space:nowrap;vertical-align:middle;`,
    tdTot: `${pad}${f}font-weight:700;color:#FFFFFF;background:${NAVY};border:1px solid ${NAVY_LINE};white-space:nowrap;`,
  };
}

// group spans + "is first in group" for the two-row header
function withGroups(cols: Col[]) {
  const sorted = [...cols].sort((a, b) => a.order - b.order);
  return sorted.map((c) => {
    const g = sorted.filter((o) => o.col === c.col);
    return { ...c, isFirst: c.order === Math.min(...g.map((o) => o.order)), span: g.length };
  });
}

function heads(cols: ReturnType<typeof withGroups>, s: Styles, nameHeader: string, rankHeader: string, arrows: boolean) {
  // the sort arrow marks the first sales $ column
  const hasCols = cols.length > 0;
  const rs = hasCols ? 2 : 1;
  const h1 =
    "<tr>" +
    `<th rowspan='${rs}' style='${s.th}'>${rankHeader}</th>` +
    `<th rowspan='${rs}' style='${s.th}text-align:left;'>${nameHeader}</th>` +
    cols.filter((c) => c.isFirst).map((c) => `<th colspan='${c.span}' style='${s.th}'>${c.header}</th>`).join("") +
    "</tr>";
  const h2 = hasCols
    ? "<tr>" +
      cols
        .map(
          (c) =>
            `<th style='${s.th}font-weight:600;'>${c.sub}${arrows && c.metric === "Sales $" && c.kind === "Num" ? " &#9660;" : ""}</th>`,
        )
        .join("") +
      "</tr>"
    : "";
  return { h1, h2, rs };
}

function numCell(v: N, c: { kind: Kind; fmt: string; isFirst: boolean }, base: string, isTot: boolean) {
  const left = c.isFirst && !isTot ? `border-left:1px solid ${GROUP_LINE};` : "";
  const hasArrow = c.kind === "Pct" && v !== null;
  const up = isTot ? TOT_UP : UP;
  const down = isTot ? TOT_DOWN : DOWN;
  const plain = isTot ? "#FFFFFF" : "inherit";
  const arrow = hasArrow ? (v! > 0 ? "&#9650; " : v! < 0 ? "&#9660; " : "") : "";
  const clr = hasArrow ? (v! > 0 ? up : v! < 0 ? down : plain) : plain;
  return `<td style='${base}${left}text-align:right;color:${clr};'>${arrow}${fmtNum(v, c.fmt)}</td>`;
}

function wrap(title: string, head: string, body: string, minWidth: boolean) {
  return (
    // fills the frame and centres the table both ways
    `<div style='${FONT_CSS}padding:1vh 1vw;box-sizing:border-box;min-height:100vh;display:flex;flex-direction:column;justify-content:center;'>` +
    `<table style='border-collapse:collapse;width:auto;${minWidth ? "min-width:66.67%;" : ""}margin:0 auto;'>` +
    `<caption style='caption-side:top;text-align:left;'>${title}</caption>` +
    `<thead>${head}</thead><tbody>${body}</tbody></table></div>`
  );
}

function titleBlock(sz: { title: string; small: string; font: string }, main: string, sub: string, badge: string | null) {
  return (
    `<div style='display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:${sz.small} calc(${sz.font} * 1.2);margin:0 0 calc(${sz.font} * 0.5) 0;'>` +
    `<div style='font-size:${sz.title};font-weight:700;color:#231F20;'>${main} <span style='font-size:${sz.small};font-weight:400;color:${MUTED};'>${sub}</span></div>` +
    (badge
      ? `<div style='font-size:${sz.small};color:#5C1A26;background:${HIGHLIGHT};padding:0.25em 0.7em;border-radius:3px;white-space:normal;'>${badge}</div>`
      : "") +
    "</div>"
  );
}

type Member = { name: string; rows: Row[]; sales: number; rank: number; isHL: boolean };

// shared body for the ranked-member tables (brands, segments, countries)
function memberTable(o: {
  t: DashStrings["tables"];
  members: Member[];
  total: { label: string; rows: Row[] };
  topN: number | null;
  sepLabel: string;
  cols: Col[];
  nameHeader: string;
  clamp: [number, number];
  pad: string;
  arrows: boolean;
  main: string;
  sub: string;
  badge: string | null;
  minWidth: boolean;
}) {
  const shown = o.members
    .filter((m) => o.topN === null || m.rank <= o.topN || m.isHL)
    .sort((a, b) => a.rank - b.rank);
  const firstExtra = o.topN === null ? null : (shown.filter((m) => m.rank > o.topN! && m.isHL)[0]?.rank ?? null);
  const cols = withGroups(o.cols);
  const names = [...shown.map((m) => m.name), o.total.label];
  const sz = sizing({
    bodyRows: shown.length + 1,
    sepRows: firstExtra === null ? 0 : 1,
    nameChars: Math.max(...names.map((n) => n.length)),
    wrapLines: names.filter((n) => n.length > 24).length,
    rs: cols.length ? 2 : 1,
    cols,
    nameMin: 6,
    nameMax: 16,
    lead: 3.8,
    clamp: o.clamp,
  });
  const s = styles(sz.font, o.pad);
  const { h1, h2 } = heads(cols, s, o.nameHeader, o.t.rank, o.arrows);
  const nameCell = "white-space:normal;min-width:6em;max-width:16em;";
  const colCount = cols.length + 2;

  const row = (name: string, rank: number | null, rows: Row[], isTot: boolean, isHL: boolean) => {
    const base = isTot ? s.tdTot : s.td;
    const bg = isTot ? NAVY : isHL ? HIGHLIGHT : "#FFFFFF";
    const sep =
      rank !== null && rank === firstExtra
        ? `<tr><td colspan='${colCount}' style='${s.pad}font-size:${sz.small};text-align:center;color:${MUTED};background:#F4F0EA;border:1px solid ${GRID};'>` +
          `&bull; &bull; &bull;&nbsp; ${o.t.outsideTop(o.sepLabel, o.topN!)} &nbsp;&bull; &bull; &bull;</td></tr>`
        : "";
    return (
      sep +
      `<tr style='background:${bg};'>` +
      `<td style='${base}text-align:center;'>${isTot ? "" : rank}</td>` +
      `<td style='${base}${nameCell}text-align:left;'>${esc(name)}</td>` +
      cols.map((c) => numCell(cellValue(rows, c), c, base, isTot)).join("") +
      "</tr>"
    );
  };
  const body = shown.map((m) => row(m.name, m.rank, m.rows, false, m.isHL)).join("") + row(o.total.label, null, o.total.rows, true, false);
  return wrap(titleBlock(sz, o.main, o.sub, o.badge), h1 + h2, body, o.minWidth);
}

function members(rows: Row[], key: (r: Row) => string, hl: Set<string>): Member[] {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const k = key(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  }
  const list = [...m.entries()].map(([name, rs]) => ({ name, rows: rs, sales: rs.reduce((s, r) => s + r.d, 0), rank: 0, isHL: hl.has(name) }));
  const rank = rankDesc(list, (x) => x.sales);
  list.forEach((x) => (x.rank = rank(x)));
  return list;
}

// keys name members in the report language; supplier and brand names stay as they are
const GROUPINGS: Record<
  Grouping,
  { key: (r: Row, lang: Lang) => string; rows: (all: Row[]) => Row[]; topN: number | null }
> = {
  suppliers: { key: (r) => r.supplier, rows: (a) => a, topN: 15 },
  brands: { key: (r) => r.brand, rows: (a) => a, topN: 15 },
  countries: { key: (r, lang) => term(lang, r.country), rows: (a) => a.filter((r) => r.segment === "Wines"), topN: 15 },
  segments: { key: (r, lang) => term(lang, r.segment), rows: (a) => a, topN: null },
};

// the supplier whose rows the demo highlights, as the supplier slicer would
export const HIGHLIGHT_SUPPLIER = "Familia Andrade";

export function buildTable(grouping: Grouping, highlight = HIGHLIGHT_SUPPLIER, lang: Lang = "en"): string {
  return withLang(lang, () => build(grouping, highlight, lang));
}

function build(grouping: Grouping, highlight: string, lang: Lang): string {
  const t = dash(lang).tables;
  const g = { ...GROUPINGS[grouping], ...t.groupings[grouping] };
  const key = (r: Row) => g.key(r, lang);
  const rows = g.rows(getRows());
  const sup = highlight;
  const supName = esc(sup);
  const hlKeys = new Set(rows.filter((r) => r.supplier === sup).map(key));
  const ms = members(rows, key, hlKeys);
  const hl = ms.filter((m) => m.isHL).sort((a, b) => a.rank - b.rank);
  const best = hl[0]?.rank;
  const names = hl.map((m) => esc(m.name)).join(", ");

  // badge wording follows each measure's title badge
  let badge: string | null = null;
  let sepLabel = supName;
  if (hl.length) {
    if (grouping === "suppliers") badge = `<b>${supName}</b> &middot; ${t.rankOf(best, ms.length)}`;
    if (grouping === "brands") {
      sepLabel = t.supBrands(supName);
      badge =
        hl.length > 1
          ? `<b>${sepLabel}</b> &middot; ${t.brandsBest(hl.length, best, ms.length)}`
          : `<b>${names}</b> &middot; ${t.rankOf(best, ms.length)}`;
    }
    if (grouping === "countries") {
      sepLabel = t.supCountries(supName);
      const inTop = hl.filter((m) => m.rank <= (g.topN ?? Infinity)).length;
      badge = `<b>${supName}</b> &middot; ${names} &middot; ${t.inTop(inTop, g.topN)}`;
    }
    if (grouping === "segments") badge = `<b>${names}</b> &middot; ${t.segmentFor(supName)}`;
  }

  return memberTable({
    t,
    members: ms,
    total: { label: g.total, rows },
    topN: g.topN,
    sepLabel,
    cols: columns(t),
    nameHeader: g.header,
    clamp: [10, 22],
    pad: "padding:0.1em 0.15em;",
    arrows: true,
    main: g.topN ? t.top(g.topN, g.plural) : g.plural[0].toUpperCase() + g.plural.slice(1),
    sub: t.sortedBy(ms.length, g.plural, t.sortLabel),
    badge,
    minWidth: true,
  });
}
