// Port of the "MOSAIQ Supplier Spotlight" DAX measure. Section numbers match
// the measure. Scope: one supplier inside "Your Agency" (the visual-level
// Agent filter); competitor and rank figures read the whole market.

import type { Lang } from "@/app/lib/i18n/config";
import { DEMO_TODAY, ListingType, NO_FILTER, OUR_AGENT, Row, RowFilter, getRows, matches } from "./data";
import { N, cssNum, currentLang, dec, divide, esc, groupBy, int, money, ordinal, parseInsertion, pct, short, spct, sum, withLang } from "./format";
import { dash, listingLabels, listingShort, term } from "./i18n";

// ------------------------------- 0 · CONFIG ---------------------------------
const FONT = "Segoe UI,Arial,sans-serif";
const MIN_BASE = 10;
const NEW_MONTHS = 18;
const MAX_ROWS = 200;
const CAT_MAX = 8;
const SUP_TOP = 10;
const DELTA_SIG = 0.1;
const MIN_BASE_D = 500;
const OBJ_FY_MONTH = 1;
const BP_CH = "1350";
const BP_RAIL = "1050";

const INK = "#2B2024";
const MUTE = "#6B625B";
const FAINT = "#A69C92";
const LINE = "#F0EBE4";
const C2 = "#7A1F2E";
const C3 = "#C48A93";
const CO = "#9C9188";
const POS = "#12A150";
const NEG = "#E5484D";

// the four period measures every table row carries
type Agg = {
  n: number;
  r3: number; r3L: number; r6: number; r6L: number;
  yt: number; ytL: number; ry: number; ryL: number;
  d: number; dL: number; st: number;
  c1: number; c2: number; c3: number; c4: number;
};

function aggregate(rs: Row[]): Agg {
  return {
    n: new Set(rs.map((r) => r.code)).size,
    r3: sum(rs, (r) => r.r3), r3L: sum(rs, (r) => r.r3L),
    r6: sum(rs, (r) => r.r6), r6L: sum(rs, (r) => r.r6L),
    yt: sum(rs, (r) => r.yt), ytL: sum(rs, (r) => r.ytL),
    ry: sum(rs, (r) => r.ry), ryL: sum(rs, (r) => r.ryL),
    d: sum(rs, (r) => r.d), dL: sum(rs, (r) => r.dL),
    st: sum(rs, (r) => r.stT),
    c1: sum(rs, (r) => r.c1), c2: sum(rs, (r) => r.c2),
    c3: sum(rs, (r) => r.c3), c4: sum(rs, (r) => r.c4),
  };
}

// a percentage off a near-zero prior year is arithmetic, not information
function deltaText(ty: number, ly: number, v: N, base: number) {
  const t = dash(currentLang()).spotlight;
  if (ly < base) return ly <= 0 && ty > 0 ? t.new : t.nm;
  return spct(v, 0);
}
function deltaColor(ly: number, v: N, base: number | null) {
  if ((base !== null && ly < base) || v === null) return FAINT;
  if (Math.abs(v) < DELTA_SIG) return MUTE;
  return v >= 0 ? POS : NEG;
}

const chCells = (c1: number, c2: number, c3: number, c4: number) => {
  const cht = c1 + c2 + c3 + c4;
  return [c1, c2, c3, c4]
    .map(
      (c, i) =>
        `<div class='c nc nc${i + 1}'><div class='v ch'>${int(c)}</div><div class='dv sub'>${pct(divide(c, cht), 0)}</div></div>`,
    )
    .join("");
};

// the shipped-cases and objectives tables are not in this mock dataset, so
// they are derived from the SKU rows with a fixed, believable spread
function objectivesFor(rs: Row[]) {
  let ship = 0;
  let shipObj = 0;
  let salesObj = 0;
  for (const r of rs) {
    const k = (parseInt(r.code.slice(-3), 10) % 17) / 100; // 0 .. 0.16
    ship += r.ry * (0.7 + k); // shipped since Jan 1, roughly in line with the calendar pace
    shipObj += r.ryL * (1.02 + k / 2);
    salesObj += r.dL * (1.04 + k / 3);
  }
  return { ship: Math.round(ship), shipObj: Math.round(shipObj), salesObj: Math.round(salesObj) };
}

export function buildSupplierSpotlight(supplierName: string, filter: RowFilter = NO_FILTER, lang: Lang = "en"): string {
  return withLang(lang, () => build(supplierName, filter, lang));
}

function build(supplierName: string, filter: RowFilter, lang: Lang): string {
  const tr = dash(lang);
  const t = tr.spotlight;
  const T = (v: string) => term(lang, v);
  const LISTING_LABELS = listingLabels(lang);
  const LISTING_SHORT = listingShort(lang);
  const all = getRows();
  const scope = all.filter((r) => r.agent === OUR_AGENT && r.supplier === supplierName && matches(filter)(r));

  // ------------------------------ 1 · SCOPE -----------------------------------
  const today = DEMO_TODAY;
  const newCut = new Date(today.getFullYear(), today.getMonth() - NEW_MONTHS, today.getDate());
  const meName = supplierName;
  const supName = esc(supplierName);
  const agentLbl = T(OUR_AGENT);
  const statLbl = filter.status === "All" ? t.allStatuses : tr.status[filter.status];
  const typLbl = filter.type === "All" ? t.allTypes : LISTING_LABELS[filter.type];

  // --------------------------- 2 · HEADLINE TOTALS ----------------------------
  const D_TY = sum(scope, (r) => r.d);
  const D_LY = sum(scope, (r) => r.dL);
  const R1T = sum(scope, (r) => r.r1);
  const R1L = sum(scope, (r) => r.r1L);
  const R3T = sum(scope, (r) => r.r3);
  const R3L = sum(scope, (r) => r.r3L);
  const R6T = sum(scope, (r) => r.r6);
  const R6L = sum(scope, (r) => r.r6L);
  const YTT = sum(scope, (r) => r.yt);
  const YTL = sum(scope, (r) => r.ytL);
  const RYT = sum(scope, (r) => r.ry);
  const RYL = sum(scope, (r) => r.ryL);
  const StT = sum(scope, (r) => r.stT);
  const velT = divide(RYT, StT);
  const DVar = divide(D_TY - D_LY, D_LY);
  const RYVar = divide(RYT - RYL, RYL);
  const DHero = D_TY >= 1000000 ? short(D_TY, "M", 2, true) : D_TY >= 1000 ? short(D_TY, "K", 0, true) : money(D_TY);

  // ---------------- 3 · MARKET TABLES + SUPPLIER RANKS (shared) ---------------
  const catSales = [...groupBy(scope, (r) => r.category).entries()]
    .map(([c, rs]) => ({ c, cs: sum(rs, (r) => r.d) }))
    .sort((a, b) => b.cs - a.cs);
  const topCat = catSales[0]?.c ?? "";
  const paysSales = [...groupBy(scope, (r) => r.country).entries()]
    .map(([p, rs]) => ({ p, ps: sum(rs, (r) => r.d) }))
    .sort((a, b) => b.ps - a.ps);
  const topPays = paysSales[0]?.p ?? "";

  const scopeCats = new Set(scope.map((r) => r.category));
  const scopeTypes = new Set(scope.map((r) => r.type));
  const scopeStats = new Set(scope.map((r) => r.status));
  const scopePays = new Set(scope.map((r) => r.country));
  const like = all.filter((r) => scopeTypes.has(r.type) && scopeStats.has(r.status));

  // supplier x category across every agent, in this supplier's categories
  const mktCatSup: (Agg & { f: string; c: string })[] = [];
  for (const [k, rs] of groupBy(like.filter((r) => scopeCats.has(r.category)), (r) => `${r.supplier}\u0000${r.category}`)) {
    const [f, c] = k.split("\u0000");
    mktCatSup.push({ f, c, ...aggregate(rs) });
  }
  const mktSup: (Agg & { f: string })[] = [];
  for (const [f, rs] of groupBy(mktCatSup, (x) => x.f)) {
    const a: Agg & { f: string } = { f, ...aggregate([]) };
    for (const x of rs) {
      (Object.keys(a) as (keyof Agg | "f")[]).forEach((k) => {
        if (k !== "f") (a[k] as number) += x[k] as number;
      });
    }
    if (a.d > 0) mktSup.push(a);
  }
  const mktPaysSup = [...groupBy(like.filter((r) => scopePays.has(r.country)), (r) => `${r.supplier}\u0000${r.country}`).entries()]
    .map(([k, rs]) => {
      const [f, p] = k.split("\u0000");
      return { f, p, d: sum(rs, (r) => r.d) };
    })
    .filter((x) => x.d > 0);

  const catRows = mktCatSup.filter((x) => x.c === topCat && x.d > 0);
  const supCatD = sum(catRows.filter((x) => x.f === meName), (x) => x.d);
  const catRank = catRows.filter((x) => x.d > supCatD).length + 1;
  const catSuppN = catRows.length;
  const paysRows = mktPaysSup.filter((x) => x.p === topPays);
  const supPaysD = sum(paysRows.filter((x) => x.f === meName), (x) => x.d);
  const paysRank = paysRows.filter((x) => x.d > supPaysD).length + 1;
  const paysSuppN = paysRows.length;

  // ---------------------------- 4 · PRODUCT TABLE -----------------------------
  const nCodes = new Set(scope.map((r) => r.code)).size;
  const keep = [...scope].sort((a, b) => b.d - a.d).slice(0, MAX_ROWS);
  const mktSku = all.filter((r) => scopeCats.has(r.category) && r.d > 0);
  const catSize = new Map<string, number>();
  for (const c of scopeCats) catSize.set(c, mktSku.filter((r) => r.category === c).length);
  const catTop = catSales.slice(0, CAT_MAX);
  const catIdx = new Map<string, number>();
  [...catTop]
    .sort((a, b) => b.cs - a.cs || (a.c < b.c ? -1 : 1))
    .forEach((x, i) => catIdx.set(x.c, i + 1));
  const distinctD = [...new Set(keep.map((r) => r.d))].sort((a, b) => b - a);

  const skuOrd = keep.map((r) => {
    const launch = parseInsertion(r.ins);
    const r3v = divide(r.r3 - r.r3L, r.r3L);
    const r6v = divide(r.r6 - r.r6L, r.r6L);
    const ytv = divide(r.yt - r.ytL, r.ytL);
    const ryv = divide(r.ry - r.ryL, r.ryL);
    const dv = divide(r.d - r.dL, r.dL);
    return {
      r, launch, r3v, r6v, ytv, ryv, dv,
      vel: divide(r.ry, r.stT),
      fDorm: r.r1 <= 0 && r.ry > 0,
      fSharp: ryv !== null && ryv < -0.25 && r.ryL >= MIN_BASE,
      fNew: launch !== null && launch >= newCut,
      o1: distinctD.indexOf(r.d) + 1,
      ki: catIdx.get(r.category) ?? null,
      cr: r.d <= 0 ? null : mktSku.filter((m) => m.category === r.category && m.d > r.d).length + 1,
      cn: catSize.get(r.category) ?? 0,
    };
  });
  const nAll = skuOrd.length;
  const capped = nCodes > nAll;

  const typeTbl = [...groupBy(scope, (r) => r.type).entries()]
    .map(([t, rs]) => ({ t, n: new Set(rs.map((r) => r.code)).size }))
    .filter((x) => x.n > 0);
  const typeN = typeTbl.length;
  const typeIdx = new Map<string, number>();
  [...typeTbl]
    .sort((a, b) => b.n - a.n || (a.t < b.t ? -1 : 1))
    .forEach((x, i) => typeIdx.set(x.t, i + 1));
  const typeOn = typeN > 1;
  const skuFs = typeN <= 2 ? "20px" : typeN === 3 ? "16px" : "13px";
  const skuMix = [...typeTbl]
    .sort((a, b) => b.n - a.n)
    .map((x) => `<div class='ksplit' style='font-size:${skuFs};'><b>${int(x.n)}</b><span class='kslab'>${LISTING_SHORT[x.t as ListingType]}</span></div>`)
    .join("");

  const skuRows = skuOrd
    .map((x) => {
      const r = x.r;
      const yi = typeIdx.get(r.type) ?? null;
      const cls =
        "skr" +
        (x.ki !== null ? ` k${x.ki}` : "") +
        (yi !== null ? ` y${yi}` : "") +
        (r.c1 > 0 ? " h1" : "") + (r.c2 > 0 ? " h2" : "") +
        (r.c3 > 0 ? " h3" : "") + (r.c4 > 0 ? " h4" : "");
      const vars = `--o1:${x.o1};--v1:${-Math.round(r.c1)};--v2:${-Math.round(r.c2)};--v3:${-Math.round(r.c3)};--v4:${-Math.round(r.c4)};`;
      const hov = t.hover(int(r.r6), x.r6v === null ? tr.na : spct(x.r6v, 0), int(r.r1), money(r.px, 2));
      const rk =
        x.cr === null
          ? `<span class='sof'>${t.unranked}</span>`
          : `<span class='srk'>#${int(x.cr)}</span><span class='sof'>${t.of} ${int(x.cn)}</span>`;
      return (
        `<div class='${cls}' style='${vars}' title='${esc(hov)}'>` +
        `<div class='c nm'><div class='nmw'><div class='nm1'>${esc(r.desc)}</div>` +
        `<div class='nm2'><span class='tchip t${r.type}'>${LISTING_SHORT[r.type]}</span>` +
        (r.status !== "Active" ? `<span class='tchip tI'>${t.inactive}</span>` : "") +
        rk +
        (x.fNew ? `<span class='flg fN'>${t.newFlag}</span>` : "") +
        (x.fDorm ? `<span class='flg fZ'>${t.noR1}</span>` : "") +
        (x.fSharp ? "<span class='flg fS'>&#9660; 25%+</span>" : "") +
        "</div></div></div>" +
        `<div class='c n3'><div class='v'>${int(r.r3)}</div><div class='dv' style='color:${deltaColor(r.r3L, x.r3v, MIN_BASE)};'>${deltaText(r.r3, r.r3L, x.r3v, MIN_BASE)}</div></div>` +
        `<div class='c n3'><div class='v'>${int(r.yt)}</div><div class='dv' style='color:${deltaColor(r.ytL, x.ytv, MIN_BASE)};'>${deltaText(r.yt, r.ytL, x.ytv, MIN_BASE)}</div></div>` +
        `<div class='c n4'><div class='v strong'>${int(r.ry)}</div><div class='dv' style='color:${deltaColor(r.ryL, x.ryv, MIN_BASE)};'>${deltaText(r.ry, r.ryL, x.ryv, MIN_BASE)}</div></div>` +
        `<div class='c n5'><div class='v'>${int(r.stT)}</div><div class='dv sub'>${r.stT > 0 ? dec(x.vel, 1) + " " + t.csPerPt : "&middot;"}</div></div>` +
        chCells(r.c1, r.c2, r.c3, r.c4) +
        `<div class='c n6'><div class='v strong'>${money(r.d)}</div><div class='dv' style='color:${deltaColor(r.dL, x.dv, MIN_BASE_D)};'>${deltaText(r.d, r.dL, x.dv, MIN_BASE_D)}</div></div>` +
        "</div>"
      );
    })
    .join("");
  const skuEmpty = nAll === 0 ? `<div class='empty'>${t.noSkus}</div>` : "";

  // ------------------------- 5 · COMPETITOR TABLE -----------------------------
  type RenderRow = Agg & { f: string; ki: number; rk: number; out: boolean };
  const denseRank = <T extends { d: number }>(xs: T[]) => {
    const ds = [...new Set(xs.map((x) => x.d))].sort((a, b) => b - a);
    return (x: T) => ds.indexOf(x.d) + 1;
  };
  const renderFor = (rows: (Agg & { f: string })[], ki: number): RenderRow[] => {
    const top = [...rows].sort((a, b) => b.d - a.d).slice(0, SUP_TOP);
    const rank = denseRank(top);
    const meD = sum(rows.filter((x) => x.f === meName), (x) => x.d);
    const meRk = rows.filter((x) => x.d > meD).length + 1;
    const meIn = top.some((x) => x.f === meName);
    const out: RenderRow[] = top.map((x) => ({ ...x, ki, rk: rank(x), out: false }));
    if (!meIn) for (const x of rows.filter((r) => r.f === meName)) out.push({ ...x, ki, rk: meRk, out: true });
    return out;
  };
  const allN = mktSup.length;
  const render: RenderRow[] = [...renderFor(mktSup, 0)];
  for (const [c, i] of catIdx) render.push(...renderFor(mktCatSup.filter((x) => x.c === c && x.d > 0), i));

  const supRows = render
    .map((x) => {
      const me = x.f === meName;
      const r3v = divide(x.r3 - x.r3L, x.r3L);
      const ytv = divide(x.yt - x.ytL, x.ytL);
      const ryv = divide(x.ry - x.ryL, x.ryL);
      const dvv = divide(x.d - x.dL, x.dL);
      const cls =
        "sar " + (x.ki === 0 ? "sa0" : `sak${x.ki}`) +
        (me ? " me" : "") + (x.out ? " out" : "") +
        (x.c1 > 0 ? " h1" : "") + (x.c2 > 0 ? " h2" : "") +
        (x.c3 > 0 ? " h3" : "") + (x.c4 > 0 ? " h4" : "");
      const v = (c: number) => (x.out ? "1" : String(-Math.round(c)));
      const vars = `--os:${x.rk};--v1:${v(x.c1)};--v2:${v(x.c2)};--v3:${v(x.c3)};--v4:${v(x.c4)};`;
      return (
        `<div class='${cls}' style='${vars}'>` +
        `<div class='c nm'><span class='srn${x.out ? " outn" : ""}'>${int(x.rk)}</span>` +
        `<div class='nmw'><div class='nm1'>${esc(x.f)}</div>` +
        `<div class='nm2'><span class='sof'>${int(x.n)} ${tr.skuCount(x.n)}` +
        (x.out ? ` &middot; ${t.outsideTop(int(SUP_TOP))}` : "") +
        "</span></div></div></div>" +
        `<div class='c n3'><div class='v'>${int(x.r3)}</div><div class='dv' style='color:${deltaColor(x.r3L, r3v, MIN_BASE)};'>${deltaText(x.r3, x.r3L, r3v, MIN_BASE)}</div></div>` +
        `<div class='c n3'><div class='v'>${int(x.yt)}</div><div class='dv' style='color:${deltaColor(x.ytL, ytv, null)};'>${deltaText(x.yt, x.ytL, ytv, MIN_BASE)}</div></div>` +
        `<div class='c n4'><div class='v strong'>${int(x.ry)}</div><div class='dv' style='color:${deltaColor(x.ryL, ryv, null)};'>${deltaText(x.ry, x.ryL, ryv, MIN_BASE)}</div></div>` +
        chCells(x.c1, x.c2, x.c3, x.c4) +
        `<div class='c n6'><div class='v strong'>${money(x.d)}</div><div class='dv' style='color:${deltaColor(x.dL, dvv, null)};'>${deltaText(x.d, x.dL, dvv, MIN_BASE_D)}</div></div>` +
        "</div>"
      );
    })
    .join("");

  // -------------------------- 6 · MOMENTUM STRIP ------------------------------
  const momentum = (
    [
      ["R1", t.momentum[0], R1T, R1L],
      ["R3", t.momentum[1], R3T, R3L],
      ["R6", t.momentum[2], R6T, R6L],
      [tr.ytd, t.momentum[3], YTT, YTL],
    ] as const
  )
    .map(([lbl, sub, t, l]) => {
      const v = divide(t - l, l);
      const c = v === null ? FAINT : v >= 0 ? POS : NEG;
      return (
        "<div class='mt'>" +
        `<div class='mtl'>${lbl}<span class='mts'>${sub}</span></div>` +
        `<div class='mtr'><span class='mtv num'>${int(t)}</span>` +
        `<span class='mtd num' style='color:${c};'>${v === null ? tr.na : spct(v)}</span></div>` +
        "</div>"
      );
    })
    .join("");

  // ---------------------- 7 · CONTEXT RAIL: CHANNELS + PRICE ------------------
  const chTbl: [string, number, number][] = [
    [tr.channels[0], sum(scope, (r) => r.c1), sum(scope, (r) => r.c1L)],
    [tr.channels[1], sum(scope, (r) => r.c2), sum(scope, (r) => r.c2L)],
    [tr.channels[2], sum(scope, (r) => r.c3), sum(scope, (r) => r.c3L)],
    [tr.channels[3], sum(scope, (r) => r.c4), sum(scope, (r) => r.c4L)],
  ];
  const chTot = sum(chTbl, (c) => c[1]);
  const chRows = [...chTbl]
    .sort((a, b) => b[1] - a[1])
    .map(([lbl, t, l]) => {
      const sh = divide(t, chTot);
      const dv = divide(t - l, l);
      return (
        `<div class='crow'><div class='clab'>${lbl}</div>` +
        `<div class='cbar'><div class='cfill' style='width:${cssNum((sh ?? 0) * 100)}%;'></div></div>` +
        `<div class='cvol num'>${int(t)}</div>` +
        `<div class='cpc num'>${pct(sh, 0)}</div>` +
        `<div class='cdv num' style='color:${deltaColor(l, dv, null)};'>${dv === null ? "&middot;" : spct(dv, 0)}</div></div>`
      );
    })
    .join("");

  const pxTY = divide(sum(keep, (r) => r.ry * r.px), sum(keep, (r) => r.ry));
  const pxLY = divide(sum(keep, (r) => r.ryL * r.pxL), sum(keep, (r) => r.ryL));
  const pxVar = divide((pxTY ?? 0) - (pxLY ?? 0), pxLY);
  const mktCat = all.filter((r) => scopeCats.has(r.category));
  const pxMkt = divide(sum(mktCat, (r) => r.ry * r.px), sum(mktCat, (r) => r.ry));
  const pxIdx = divide(pxTY, pxMkt);
  const priceRows =
    `<div class='prow'><span class='plab'>${t.avgPrice}</span><span class='pval num'>${money(pxTY, 2)}</span>` +
    `<span class='pdv num' style='color:${pxVar === null ? FAINT : pxVar >= 0 ? POS : NEG};'>${pxVar === null ? "&middot;" : spct(pxVar, 0)}</span></div>` +
    `<div class='prow'><span class='plab'>${t.catAvg}</span><span class='pval num'>${money(pxMkt, 2)}</span>` +
    `<span class='pdv num' style='color:${MUTE};'>${t.idx} ${int((pxIdx ?? 0) * 100)}</span></div>` +
    `<div class='prow'><span class='plab'>${t.velocity}</span><span class='pval num'>${dec(velT, 1)}</span>` +
    `<span class='pdv num' style='color:${MUTE};'>${t.csPerPoint}</span></div>`;

  // ----------------------- 7b · OBJECTIVES (rail) -----------------------------
  const objStart = new Date(today.getFullYear() - (today.getMonth() + 1 < OBJ_FY_MONTH ? 1 : 0), OBJ_FY_MONTH - 1, 1);
  const objEnd = new Date(objStart.getFullYear() + 1, objStart.getMonth(), 1);
  const dayMs = 86400000;
  const pace = (Math.round((today.getTime() - objStart.getTime()) / dayMs) + 1) / Math.round((objEnd.getTime() - objStart.getTime()) / dayMs);
  const obj = objectivesFor(scope);
  const objTbl: [string, string, number, number, (x: number) => string, string, number | null][] = [
    [t.shipments, t.shippedYtd, obj.ship, obj.shipObj, int, " " + tr.cs, pace],
    [tr.sales, t.salesRy, D_TY, obj.salesObj, (x) => money(x), "", null],
  ];
  const objRows = objTbl
    .map(([lbl, cap, act, goal, fmt, unit, pc0]) => {
      const pc = divide(act, goal);
      const col =
        pc === null ? FAINT : pc0 === null ? (pc >= 1 ? POS : INK) : pc >= pc0 ? POS : pc >= pc0 - DELTA_SIG ? MUTE : NEG;
      const w = pc === null ? "0" : cssNum(Math.min(pc, 1) * 100);
      return (
        "<div class='ob'>" +
        `<div class='obh'><span class='plab'>${lbl}</span>` +
        `<span class='obp num' style='color:${col};'>${pc === null ? "&mdash;" : pct(pc, 0)}</span></div>` +
        `<div class='obar'><div class='obf' style='width:${w}%;background:${col};'></div>` +
        (pc0 !== null ? `<div class='obm' style='left:${cssNum(pc0 * 100)}%;' title='${t.expectedPace}'></div>` : "") +
        "</div>" +
        `<div class='obs num'>${fmt(act)}${unit} ${cap} &middot; ${t.goal} ${fmt(goal)}${unit}</div>` +
        "</div>"
      );
    })
    .join("");

  // ------------------------------- 8 · STYLE ----------------------------------
  const chOpt: [number, string, number][] = chTbl.map((c, i) => [i + 1, c[0], c[1]]);
  const catIdxList = [...catIdx.entries()].sort((a, b) => a[1] - b[1]);
  const typeIdxList = [...typeIdx.entries()].sort((a, b) => a[1] - b[1]);
  const typeCount = new Map(typeTbl.map((x) => [x.t, x.n]));

  const catCss = catIdxList
    .map(
      ([, i]) =>
        `#vwP:checked ~ #ct${i}:checked ~ .mqx .skr.k${i}{display:flex;order:var(--o1);}` +
        `#vwC:checked ~ #ct${i}:checked ~ .mqx .sar.sak${i}{display:flex;order:var(--os);}` +
        `#ct${i}:checked ~ .mqx label[for=ct${i}]{background:${INK};color:#FFFFFF;}` +
        `#ct${i}:checked ~ .mqx .ddv .o.ct${i}{display:inline;}`,
    )
    .join("");
  const typeCss =
    `#ty0:checked ~ .mqx label[for=ty0]{background:${INK};color:#FFFFFF;}` +
    "#ty0:checked ~ .mqx .ddv .o.ty0{display:inline;}" +
    "#vwC:checked ~ .mqx .segt{display:none;}" +
    typeIdxList
      .map(
        ([, j]) =>
          `#ty${j}:checked ~ .mqx .skr:not(.y${j}){display:none !important;}` +
          `#ty${j}:checked ~ .mqx label[for=ty${j}]{background:${INK};color:#FFFFFF;}` +
          `#ty${j}:checked ~ .mqx .ddv .o.ty${j}{display:inline;}`,
      )
      .join("");
  const chanCss =
    `#ch0:checked ~ .mqx label[for=ch0]{background:${INK};color:#FFFFFF;}` +
    "#ch0:checked ~ .mqx .ddv .o.ch0{display:inline;}" +
    chOpt
      .map(
        ([h]) =>
          `#ch${h}:checked ~ .mqx .skr:not(.h${h}),#ch${h}:checked ~ .mqx .sar:not(.h${h}){display:none !important;}` +
          `#ch${h}:checked ~ .mqx .skr,#ch${h}:checked ~ .mqx .sar{order:var(--v${h}) !important;}` +
          `#ch${h}:checked ~ .mqx .nc${h}{display:block !important;}` +
          `#ch${h}:checked ~ .mqx .skr .nc${h} .v,#ch${h}:checked ~ .mqx .sar .nc${h} .v{color:${INK};font-weight:800;}` +
          `#ch${h}:checked ~ .mqx .skhd .nc${h}{color:${INK};}` +
          `#ch${h}:checked ~ .mqx label[for=ch${h}]{background:${INK};color:#FFFFFF;}` +
          `#ch${h}:checked ~ .mqx .ddv .o.ch${h}{display:inline;}`,
      )
      .join("");

  const F = FONT;
  const style =
    "<style>" +
    "html,body{margin:0;padding:0;height:100%;overflow:hidden;}" +
    ".mq,.mq *{box-sizing:border-box;}" +
    ".mqr{position:absolute;opacity:0;width:0;height:0;pointer-events:none;}" +
    ".num{font-variant-numeric:tabular-nums;font-feature-settings:'tnum';}" +
    ".card{background:#FFFFFF;border-radius:10px;box-shadow:0 1px 3px rgba(43,32,36,.08);padding:9px 11px;}" +
    `.eyebrow{font:700 10px ${F};letter-spacing:.8px;color:${FAINT};text-transform:uppercase;}` +
    `.pill{display:inline-block;font:600 10.5px ${F};color:${MUTE};background:#F2EDE6;border-radius:5px;padding:2px 6px;margin-left:4px;}` +
    ".hero{display:flex;gap:6px;flex:none;}" +
    ".hcard{background:#FFFFFF;border-radius:10px;box-shadow:0 1px 3px rgba(43,32,36,.08);padding:8px 12px;display:flex;flex-direction:column;justify-content:center;min-width:0;overflow:hidden;}" +
    `.hbig{font:800 28px ${F};color:${INK};line-height:1;letter-spacing:-.4px;white-space:nowrap;}` +
    ".hrow{display:flex;align-items:baseline;gap:8px;margin-top:4px;}" +
    `.hdv{font:800 13.5px ${F};white-space:nowrap;}` +
    `.hsub{font:500 11px ${F};color:${FAINT};white-space:nowrap;}` +
    ".rline{display:flex;align-items:baseline;gap:6px;min-width:0;}" +
    `.rbig{font:800 18px ${F};color:${INK};line-height:1.2;flex:none;}` +
    `.rtxt{font:600 11px ${F};color:${MUTE};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}` +
    ".ksplits{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;}" +
    `.ksplit{font-family:${F};font-weight:800;color:${INK};line-height:1.15;white-space:nowrap;}` +
    `.kslab{font-size:.55em;font-weight:700;color:${MUTE};margin-left:5px;letter-spacing:.4px;}` +
    ".mstrip{display:flex;gap:6px;flex:none;}" +
    ".mt{flex:1;background:#FFFFFF;border-radius:8px;box-shadow:0 1px 3px rgba(43,32,36,.08);padding:5px 9px;min-width:0;}" +
    `.mtl{font:800 10.5px ${F};color:${INK};letter-spacing:.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}` +
    `.mts{font:500 10px ${F};color:${FAINT};margin-left:5px;letter-spacing:0;}` +
    ".mtr{display:flex;align-items:baseline;gap:6px;margin-top:1px;}" +
    `.mtv{font:800 15px ${F};color:${INK};}` +
    `.mtd{font:700 11.5px ${F};}` +
    ".skhd{display:flex;align-items:center;gap:5px;padding:0 5px 4px 0;border-bottom:1px solid #E9E2D8;}" +
    `.skhd .c{font:700 9.5px ${F};letter-spacing:.5px;color:${FAINT};text-transform:uppercase;white-space:nowrap;}` +
    ".skl{display:flex;flex-direction:column;}" +
    ".skr,.sar{display:none;align-items:center;gap:5px;padding:4px 5px 4px 0;border-bottom:1px solid #F6F2EC;}" +
    ".skr:hover,.sar:hover{background:#FAF7F2;}" +
    ".c{min-width:0;}" +
    ".nm{flex:1 1 auto;display:flex;align-items:center;min-width:120px;}" +
    ".nmw{min-width:0;flex:1 1 auto;}" +
    ".n3{width:58px;text-align:right;flex:none;}" +
    ".n4{width:66px;text-align:right;flex:none;}" +
    ".n5{width:62px;text-align:right;flex:none;}" +
    ".nc{width:52px;text-align:right;flex:none;}" +
    ".skhd .nc{white-space:normal;line-height:1.15;}" +
    ".n6{width:82px;text-align:right;flex:none;}" +
    `.v.ch{font-weight:600;font-size:11.5px;color:${MUTE};}` +
    `.nm1{font:600 12.5px ${F};color:${INK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;}` +
    ".nm2{display:flex;align-items:center;gap:4px;margin-top:1px;overflow:hidden;white-space:nowrap;}" +
    `.srk{font:800 10px ${F};color:${C2};}` +
    `.sof{font:500 10px ${F};color:${FAINT};}` +
    `.srn{width:22px;flex:none;text-align:center;font:800 10.5px ${F};color:${MUTE};background:#F2EDE6;border-radius:4px;padding:2px 0;margin-right:7px;}` +
    ".srn.outn{background:#FDE9C8;color:#8A5A00;}" +
    ".sar.me{background:#F7E9EB;}" +
    `.sar.me .nm1{font-weight:800;color:${C2};}` +
    `.sar.me .srn{background:${C2};color:#FFFFFF;}` +
    ".sar.out{border-top:1px dashed #D9CFC3;}" +
    `.tchip{font:700 9px ${F};letter-spacing:.3px;border-radius:3px;padding:1px 4px;flex:none;background:#F2EDE6;color:${MUTE};}` +
    `.tRA{background:${INK};color:#FFFFFF;}.tSA{background:${C2};color:#FFFFFF;}.tSL{background:#EFDDD8;color:${INK};}` +
    ".tI{background:#F4E2E3;color:#A03038;}" +
    `.flg{font:700 9px ${F};border-radius:3px;padding:1px 4px;flex:none;}` +
    ".fZ,.fS{background:#F4E2E3;color:#A03038;}.fN{background:#D8F0E2;color:#0A6B39;}" +
    `.v{font:600 12.5px ${F};color:${INK};font-variant-numeric:tabular-nums;white-space:nowrap;}` +
    ".v.strong{font-weight:800;}" +
    `.dv{font:600 10px ${F};margin-top:1px;font-variant-numeric:tabular-nums;white-space:nowrap;}` +
    `.dv.sub{color:${FAINT};}` +
    `.empty{font:13px ${F};color:${FAINT};padding:14px 0;}` +
    ".rail{width:300px;flex:none;display:flex;flex-direction:column;gap:6px;min-height:0;}" +
    ".crow{display:flex;align-items:center;gap:6px;padding:2px 0;}" +
    `.clab{width:92px;flex:none;font:600 10.5px ${F};color:${MUTE};white-space:nowrap;}` +
    ".cbar{flex:1 1 auto;min-width:0;height:9px;background:#EEE8E0;border-radius:3px;position:relative;overflow:hidden;}" +
    `.cfill{height:100%;background:${C3};border-radius:3px;}` +
    `.cvol{width:48px;text-align:right;font:700 11.5px ${F};color:${INK};flex:none;}` +
    `.cpc{width:32px;text-align:right;font:600 10.5px ${F};color:${MUTE};flex:none;}` +
    `.cdv{width:36px;text-align:right;font:700 10px ${F};flex:none;}` +
    `.prow{display:flex;align-items:baseline;gap:6px;padding:2px 0;border-top:1px solid ${LINE};}` +
    `.plab{flex:1 1 auto;font:600 10.5px ${F};color:${MUTE};}` +
    `.pval{font:800 12.5px ${F};color:${INK};}` +
    `.pdv{font:600 10px ${F};}` +
    `.ob{padding:4px 0;}.ob + .ob{border-top:1px solid ${LINE};}` +
    ".obh{display:flex;justify-content:space-between;align-items:baseline;}" +
    `.obp{font:800 13px ${F};}` +
    ".obar{position:relative;height:7px;background:#EEE8E0;border-radius:3px;margin:3px 0 2px;}" +
    ".obf{height:100%;border-radius:3px;}" +
    `.obm{position:absolute;top:-2px;bottom:-2px;width:2px;background:${INK};border-radius:1px;}` +
    `.obs{font:500 10px ${F};color:${MUTE};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}` +
    ".seg{display:flex;gap:2px;background:#ECE5DB;border-radius:14px;padding:2px;flex:none;flex-wrap:wrap;row-gap:2px;max-width:100%;}" +
    `.seg label{cursor:pointer;font:700 10.5px ${F};color:${MUTE};border-radius:12px;padding:3px 9px;white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis;-webkit-user-select:none;user-select:none;}` +
    `.seg label:hover{color:${INK};}` +
    ".segv label{padding:3px 11px;}" +
    ".dd{position:relative;flex:none;}" +
    `.ddb{display:flex;align-items:center;gap:6px;cursor:pointer;background:#ECE5DB;border-radius:14px;padding:4px 10px;font:700 10.5px ${F};color:${INK};white-space:nowrap;max-width:230px;-webkit-user-select:none;user-select:none;}` +
    `.ddl{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:${FAINT};flex:none;}` +
    ".ddv{overflow:hidden;text-overflow:ellipsis;min-width:0;}" +
    ".ddv .o{display:none;}" +
    `.car{font-size:9px;color:${MUTE};flex:none;}` +
    ".dd:hover .ddb{background:#E3DACD;}" +
    ".ddm{display:none;position:absolute;top:100%;left:0;z-index:50;padding-top:4px;min-width:100%;}" +
    ".dd:hover .ddm{display:block;}" +
    ".ddi{background:#FFFFFF;border-radius:8px;box-shadow:0 6px 18px rgba(43,32,36,.18);padding:4px;max-height:260px;overflow-y:auto;}" +
    `.ddi label{display:flex;justify-content:space-between;gap:12px;cursor:pointer;font:600 11px ${F};color:${MUTE};border-radius:6px;padding:5px 9px;white-space:nowrap;-webkit-user-select:none;user-select:none;}` +
    `.ddi label:hover{background:#F5F0E9;color:${INK};}` +
    ".ddi .cnt{opacity:.6;font-weight:600;}" +
    `#sk1:not(:checked) ~ .mqx .ddc .ddb,#ty0:not(:checked) ~ .mqx .ddt .ddb,#ch0:not(:checked) ~ .mqx .ddh .ddb{box-shadow:inset 0 0 0 1.5px ${INK};background:#FFFFFF;}` +
    "#vwP:checked ~ .mqx label[for=vwP],#vwC:checked ~ .mqx label[for=vwC]," +
    `#sk1:checked ~ .mqx label[for=sk1]{background:${INK};color:#FFFFFF;}` +
    "#sk1:checked ~ .mqx .ddv .o.sk1{display:inline;}" +
    "#vwP:checked ~ #sk1:checked ~ .mqx .skr{display:flex;order:var(--o1);}" +
    "#vwC:checked ~ #sk1:checked ~ .mqx .sar.sa0{display:flex;order:var(--os);}" +
    ".thP,.thC,.capP,.capC{display:none;}" +
    "#vwP:checked ~ .mqx .thP{display:flex;}#vwC:checked ~ .mqx .thC{display:flex;}" +
    "#vwP:checked ~ .mqx .capP{display:inline;}#vwC:checked ~ .mqx .capC{display:inline;}" +
    catCss +
    typeCss +
    chanCss +
    ".scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:4px;scrollbar-width:thin;scrollbar-color:#D9CFC3 transparent;}" +
    ".scroll::-webkit-scrollbar{width:6px;}" +
    ".scroll::-webkit-scrollbar-thumb{background:#D9CFC3;border-radius:3px;}" +
    `@media (max-width:${BP_CH}px){.skhd .nc,.skr .nc,.sar .nc{display:none;}.rail{width:270px;}}` +
    `@media (max-width:${BP_RAIL}px){.rail{display:none;}.hbig{font-size:22px;}.rbig{font-size:15px;}.hpills{display:none;}}` +
    "@media (max-height:620px){.mstrip{display:none;}}" +
    "</style>";

  const radios =
    "<input class='mqr' type='radio' name='vwtab' id='vwP' checked>" +
    "<input class='mqr' type='radio' name='vwtab' id='vwC'>" +
    "<input class='mqr' type='radio' name='sktab' id='sk1' checked>" +
    catIdxList.map(([, i]) => `<input class='mqr' type='radio' name='sktab' id='ct${i}'>`).join("") +
    (typeOn
      ? "<input class='mqr' type='radio' name='tytab' id='ty0' checked>" +
        typeIdxList.map(([, j]) => `<input class='mqr' type='radio' name='tytab' id='ty${j}'>`).join("")
      : "") +
    "<input class='mqr' type='radio' name='chtab' id='ch0' checked>" +
    chOpt.map(([h]) => `<input class='mqr' type='radio' name='chtab' id='ch${h}'>`).join("");

  const catDD =
    "<div class='dd ddc'>" +
    `<div class='ddb'><span class='ddl'>${t.categoryDD}</span><span class='ddv'><span class='o sk1'>${t.allFem}</span>` +
    catIdxList.map(([c, i]) => `<span class='o ct${i}'>${esc(T(c))}</span>`).join("") +
    "</span><span class='car'>&#9662;</span></div>" +
    `<div class='ddm'><div class='ddi'><label for='sk1'>${t.allCategories}</label>` +
    catIdxList.map(([c, i]) => `<label for='ct${i}' title='${esc(T(c))}'>${esc(T(c))}</label>`).join("") +
    "</div></div>" +
    "</div>";
  const typeDD = typeOn
    ? "<div class='dd ddt segt'>" +
      `<div class='ddb'><span class='ddl'>${t.typeDD}</span><span class='ddv'><span class='o ty0'>${t.all}</span>` +
      typeIdxList.map(([t, j]) => `<span class='o ty${j}'>${t}</span>`).join("") +
      "</span><span class='car'>&#9662;</span></div>" +
      `<div class='ddm'><div class='ddi'><label for='ty0'>${t.allTypesDD}</label>` +
      typeIdxList.map(([t, j]) => `<label for='ty${j}' title='${LISTING_LABELS[t as ListingType]}'>${LISTING_SHORT[t as ListingType]}<span class='cnt'>${int(typeCount.get(t) ?? 0)}</span></label>`).join("") +
      "</div></div>" +
      "</div>"
    : "";
  const chanDD =
    "<div class='dd ddh'>" +
    `<div class='ddb'><span class='ddl'>${t.channelDD}</span><span class='ddv'><span class='o ch0'>${t.all}</span>` +
    chOpt.map(([h, l]) => `<span class='o ch${h}'>${l}</span>`).join("") +
    "</span><span class='car'>&#9662;</span></div>" +
    `<div class='ddm'><div class='ddi'><label for='ch0'>${t.allChannels}</label>` +
    chOpt.map(([h, l, v]) => `<label for='ch${h}'>${l}<span class='cnt'>${int(v)} ${tr.cs}</span></label>`).join("") +
    "</div></div>" +
    "</div>";

  // ------------------------------ 9 · ASSEMBLE --------------------------------
  const header =
    "<div style='display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex:none;padding:0 2px 6px 2px;min-width:0;'>" +
    "<div style='display:flex;align-items:baseline;gap:9px;min-width:0;'>" +
    `<span class='eyebrow' style='flex:none;'>${t.title}</span>` +
    `<span style='font:800 19px ${F};color:${INK};letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;'>${supName}</span>` +
    "</div>" +
    "<div class='hpills' style='white-space:nowrap;flex:none;'>" +
    `<span class='pill'>${agentLbl}</span><span class='pill'>${typLbl}</span><span class='pill'>${statLbl}</span>` +
    "</div>" +
    "</div>";

  const heroVar = (v: N) =>
    `<span class='hdv' style='color:${v === null ? FAINT : v >= 0 ? POS : NEG};'>` +
    (v === null ? tr.na : (v >= 0 ? "&#9650; " : "&#9660; ") + pct(Math.abs(v))) +
    "</span>";
  const hero =
    "<div class='hero' style='min-height:76px;'>" +
    `<div class='hcard' style='flex:1.45;border-left:4px solid ${INK};'>` +
    `<div class='eyebrow'>${t.salesRolling}</div>` +
    `<div class='hrow'><span class='hbig'>${DHero}</span>${heroVar(DVar)}</div>` +
    "</div>" +
    `<div class='hcard' style='flex:1.45;border-left:4px solid ${C2};'>` +
    `<div class='eyebrow'>${t.casesRolling}</div>` +
    `<div class='hrow'><span class='hbig'>${int(RYT)}</span>${heroVar(RYVar)}</div>` +
    "</div>" +
    `<div class='hcard' style='flex:1.5;border-left:4px solid ${C3};'>` +
    `<div class='eyebrow'>${t.rankBySales}</div>` +
    `<div class='rline' style='margin-top:3px;'><span class='rbig'>${int(paysRank)}${ordinal(paysRank)}</span>` +
    `<span class='rtxt'>${t.rankIn(esc(T(topPays)), int(paysSuppN))}</span></div>` +
    `<div class='rline'><span class='rbig'>${int(catRank)}${ordinal(catRank)}</span>` +
    `<span class='rtxt'>${t.rankIn(esc(T(topCat)), int(catSuppN))}</span></div>` +
    "</div>" +
    `<div class='hcard' style='flex:1;border-left:4px solid ${CO};'>` +
    `<div class='eyebrow'>${tr.skus}</div>` +
    `<div class='ksplits' style='margin-top:3px;'>${skuMix}</div>` +
    "</div>" +
    "</div>";

  const headChannels = t.head.channels.map((c, i) => `<div class='c nc nc${i + 1}'>${c}</div>`).join("");
  const tableCard =
    "<div class='card' style='flex:1 1 auto;min-height:0;display:flex;flex-direction:column;'>" +
    "<div style='display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px;flex:none;flex-wrap:wrap;row-gap:4px;'>" +
    "<div style='display:flex;align-items:center;gap:6px;min-width:0;flex-wrap:wrap;row-gap:4px;'>" +
    `<div class='seg segv'><label for='vwP'>${t.products}</label><label for='vwC'>${t.competitors}</label></div>` +
    catDD +
    typeDD +
    chanDD +
    "</div>" +
    "<span class='eyebrow'>" +
    `<span class='capP'>${capped ? t.topOf(int(nAll), int(nCodes), tr.skuCount(nCodes)) : t.skusCases(int(nAll))}</span>` +
    `<span class='capC'>${t.topOf(int(SUP_TOP), int(allN), t.suppliersAllAgents)}</span>` +
    "</span>" +
    "</div>" +
    `<div class='skhd thP'><div class='c nm'>${t.head.product}</div><div class='c n3'>${t.head.r3}</div><div class='c n3'>${t.head.ytd}</div>` +
    `<div class='c n4'>${t.head.ry9l}</div><div class='c n5'>${t.head.stores}</div>` +
    headChannels +
    `<div class='c n6'>${t.head.salesRy}</div></div>` +
    `<div class='skhd thC'><div class='c nm'>${t.head.supplier}</div><div class='c n3'>${t.head.r3}</div><div class='c n3'>${t.head.ytd}</div>` +
    `<div class='c n4'>${t.head.ry9l}</div>` +
    headChannels +
    `<div class='c n6'>${t.head.salesRy}</div></div>` +
    `<div class='scroll'><div class='skl'>${skuRows}${supRows}</div>${skuEmpty}</div>` +
    "</div>";

  const rail =
    "<div class='rail'>" +
    "<div class='card' style='flex:1 1 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden;'>" +
    `<div class='eyebrow' style='margin-bottom:4px;'>${t.channelMix}</div>` +
    chRows +
    `<div style='margin-top:7px;'>${priceRows}</div>` +
    `<div class='sof' style='margin-top:6px;line-height:1.35;'>${t.shareNote}</div>` +
    "</div>" +
    "<div class='card' style='flex:none;'>" +
    `<div class='eyebrow' style='margin-bottom:2px;'>${t.objectives(pct(pace, 0))}</div>` +
    objRows +
    `<div class='sof' style='margin-top:3px;'>${t.depletion(int(RYT))}</div>` +
    "</div>" +
    "</div>";

  return (
    `<div class='mq' style='font-family:${F};background:#F6F3EE;padding:8px 10px;border-radius:12px;overflow:hidden;height:100vh;display:flex;flex-direction:column;'>` +
    style +
    radios +
    "<div class='mqx' style='flex:1 1 auto;min-height:0;display:flex;flex-direction:column;'>" +
    header +
    hero +
    `<div class='mstrip' style='margin-top:6px;'>${momentum}</div>` +
    "<div style='display:flex;gap:7px;align-items:stretch;margin-top:6px;flex:1 1 auto;min-height:0;'>" +
    `<div style='flex:1 1 auto;min-width:0;min-height:0;display:flex;flex-direction:column;'>${tableCard}</div>` +
    rail +
    "</div>" +
    "</div>" +
    "</div>"
  );
}
