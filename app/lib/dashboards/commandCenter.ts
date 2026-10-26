// Port of the "MOSAIQ Command Center" DAX measure (HTML Content visual,
// 1280 x 720). Section numbers match the measure so the two can be read side
// by side. All interactions are CSS-only radios, exactly as in Power BI.

import type { Lang } from "@/app/lib/i18n/config";
import { FIRST_YEAR, MAX_YEAR, NO_FILTER, OUR_AGENT, Row, RowFilter, getRows, matches } from "./data";
import { N, cssNum, divide, dround, esc, groupBy, int, mdy, money, ordinal, parseInsertion, pct, short, spct, sum, withLang } from "./format";
import { dash, listingLabels, listingShort, term } from "./i18n";

// ------------------------------- 0 · CONFIG ---------------------------------
const FONT = "Segoe UI,Arial,sans-serif";
const RY_YR = 2026; // sentinel year id for the rolling-year column
const PLOT_H = 270;
const WINS = [3, 5, 10];
const DIMS = ["A", "B", "C"] as const;
const METRICS = ["V", "S", "D"] as const;
const N_TOP = 8;
const N_TIP = 12;
const N_SKU = 10;
const MIN_BASE_LY = 1000;
const N_CAT = 3;
const SEG_MAX = 8;
const MIX_H = 118;
const TYPE_LIST = ["RA", "SA", "SL"] as const;
const GROW_TYPES = ["RA", "SA"];

const FAINT = "#A69C92";
const C2 = "#7A1F2E";
const CO = "#9C9188";
const POS = "#12A150";
const NEG = "#E5484D";

const HUE_A = 350; // wine
const HUE_B = 22; // terracotta
const L_MIN = 20;
const L_MAX = 80;
const SAT_HI = 48;
const SAT_LO = 28;

type Dm = (typeof DIMS)[number];
type Mt = (typeof METRICS)[number];

const varColor = (v: N) => (v === null ? FAINT : v >= 0 ? POS : NEG);
const varArrow = (v: N) => (v === null ? "&middot;" : v >= 0 ? "&#9650;" : "&#9660;");
const varText = (v: N, na: string) => (v === null ? na : spct(v));

function ramp(rank: number, cnt: number) {
  const t = (rank - 1) / Math.max(cnt - 1, 1);
  const lgt = L_MIN + t * (L_MAX - L_MIN);
  const hue = rank % 2 === 0 ? HUE_B : HUE_A;
  const sat = SAT_HI - t * (SAT_HI - SAT_LO);
  return { clr: `hsl(${dround(hue)},${dround(sat)}%,${dround(lgt)}%)`, lgt };
}

export function buildCommandCenter(filter: RowFilter = NO_FILTER, lang: Lang = "en"): string {
  return withLang(lang, () => build(filter, lang));
}

function build(filter: RowFilter, lang: Lang): string {
  const t = dash(lang);
  const tc = t.command;
  const T = (v: string) => term(lang, v);
  const labels = listingLabels(lang);
  const shortType = listingShort(lang);
  // members are named in the report language
  const dimOf = (r: Row, dm: Dm) => (dm === "A" ? T(r.country) : dm === "B" ? T(r.category) : labels[r.type]);

  // slicers apply to the whole market, so ranks stay like for like
  const all = getRows().filter(matches(filter));
  const rows = all.filter((r) => r.agent === OUR_AGENT);

  // --------------------------- 1 · HEADLINE + KPI -----------------------------
  const TY = sum(rows, (r) => r.d);
  const LY = sum(rows, (r) => r.dL);
  const VP = divide(TY - LY, LY);
  const TYcs = sum(rows, (r) => r.ry);
  const LYcs = sum(rows, (r) => r.ryL);
  const VPcs = divide(TYcs - LYcs, LYcs);
  const active = rows.filter((r) => r.status === "Active");
  const totalSKUs = new Set(active.map((r) => r.code)).size;
  const activeSupps = new Set(active.map((r) => r.supplier)).size;
  const agentSales = [...groupBy(all, (r) => r.agent).entries()].map(([a, rs]) => [a, sum(rs, (r) => r.d)] as const);
  const ourSales = agentSales.find(([a]) => a === OUR_AGENT)![1];
  const agentRank = new Set(agentSales.filter(([, s]) => s > ourSales).map(([, s]) => s)).size + 1;

  // ---------------------- 2 · TEN-YEAR BASE (long + agg) ----------------------
  // agg[dm][dim][yr] = { A: cases, N: active SKUs, D: sales $ }
  type Cell = { A: number; N: number; D: number };
  const agg = new Map<string, Cell>();
  const key = (dm: string, dim: string, yr: number) => `${dm}|${dim}|${yr}`;
  const add = (k: string, c: Cell) => {
    const cur = agg.get(k);
    if (cur) {
      cur.A += c.A;
      cur.N += c.N;
      cur.D += c.D;
    } else agg.set(k, { ...c });
  };
  const members: Record<Dm, Set<string>> = { A: new Set(), B: new Set(), C: new Set() };
  for (const r of rows) {
    for (const dm of DIMS) {
      const dim = dimOf(r, dm);
      for (let i = 0; i < r.hist.length; i++) {
        const yr = FIRST_YEAR + i;
        if (r.hist[i] === 0 && r.histD[i] === 0) continue;
        members[dm].add(dim);
        add(key(dm, dim, yr), { A: r.hist[i], N: r.hist[i] > 0 ? 1 : 0, D: r.histD[i] });
      }
    }
  }

  // ---------- 2b · rolling-year slice, same 3 dims ----------
  type Mix = { dm: Dm; dim: string; V: number; Q: number; K: number };
  const ryMix: Mix[] = [];
  for (const dm of DIMS) {
    for (const [dim, rs] of groupBy(rows, (r) => dimOf(r, dm))) {
      const V = sum(rs, (r) => r.d);
      const Q = sum(rs, (r) => r.ry);
      const K = new Set(rs.filter((r) => r.d > 0).map((r) => r.code)).size;
      if (V > 0 || Q > 0) {
        ryMix.push({ dm, dim, V, Q, K });
        members[dm].add(dim);
        add(key(dm, dim, RY_YR), { A: Q, N: K, D: V });
      }
    }
  }
  const lastIdx = MAX_YEAR - FIRST_YEAR;
  const RYQLY = sum(rows, (r) => r.hist[lastIdx]);
  const RYKLY = new Set(rows.filter((r) => r.hist[lastIdx] > 0).map((r) => r.code)).size;
  const RYVLY = sum(rows, (r) => r.histD[lastIdx]);

  const YEARS: number[] = [];
  for (let y = FIRST_YEAR; y <= MAX_YEAR; y++) YEARS.push(y);
  YEARS.push(RY_YR);

  const cell = (dm: Dm, dim: string, yr: number): Cell => agg.get(key(dm, dim, yr)) ?? { A: 0, N: 0, D: 0 };
  const yrTot = (dm: Dm, yr: number): Cell => {
    const t = { A: 0, N: 0, D: 0 };
    for (const dim of members[dm]) {
      const c = cell(dm, dim, yr);
      t.A += c.A;
      t.N += c.N;
      t.D += c.D;
    }
    return t;
  };

  // ------------- 2c · ONE GLOBAL RANK PER MEMBER (colour + stack order) -------
  const dimRank: Record<Dm, Map<string, number>> = { A: new Map(), B: new Map(), C: new Map() };
  for (const dm of DIMS) {
    const ord = [...members[dm]].map((dim) => ({
      dim,
      o1: sum(ryMix.filter((m) => m.dm === dm && m.dim === dim), (m) => m.V),
      o2: cell(dm, dim, MAX_YEAR).A,
    }));
    ord.sort((a, b) => b.o1 - a.o1 || b.o2 - a.o2 || (a.dim < b.dim ? -1 : a.dim > b.dim ? 1 : 0));
    ord.forEach((o, i) => dimRank[dm].set(o.dim, i + 1));
  }

  const histTotal = (yr: number) => sum(rows, (r) => r.hist[yr - FIRST_YEAR]);
  const CY = histTotal(MAX_YEAR);
  const T3 = histTotal(2022);
  const T5 = histTotal(2020);
  const FY = histTotal(FIRST_YEAR);
  const years10 = MAX_YEAR - FIRST_YEAR;
  const growth3 = divide(CY - T3, T3) ?? 0;
  const growth5 = divide(CY - T5, T5) ?? 0;
  const growth10 = divide(CY - FY, FY) ?? 0;
  const cagr3 = T3 > 0 ? Math.pow(CY / T3, 1 / 3) - 1 : null;
  const cagr5 = T5 > 0 ? Math.pow(CY / T5, 1 / 5) - 1 : null;
  const cagr10 = FY > 0 ? Math.pow(CY / FY, 1 / years10) - 1 : null;

  const winStart = (w: number) => (MAX_YEAR - w > FIRST_YEAR ? MAX_YEAR - w : FIRST_YEAR);
  const rangeLbl = WINS.map((w) => `<span class='wlab l${w}'>${winStart(w)}&ndash;${MAX_YEAR} + ${t.ytd}</span>`).join("");

  // ------------------- 3 · TREND PANELS (3 dims x 3 metrics) ------------------
  const metricOf = (c: Cell, mt: Mt) => (mt === "V" ? c.A : mt === "S" ? c.N : c.D);
  const secOf = (c: Cell, mt: Mt) => (mt === "V" ? c.N : c.A);
  const csText = (v: number) => (v >= 1000000 ? short(v, "M", 1) : short(v, "K", 0)) + " " + t.cs;

  let panels = "";
  for (const dm of DIMS) {
    const rk = [...members[dm]].map((dim) => ({ dim, rank: dimRank[dm].get(dim)! }));
    const cnt = rk.length;
    for (const mt of METRICS) {
      const isD = mt === "D";
      const yrs = YEARS.map((y) => ({ y, tot: metricOf(yrTot(dm, y), mt) }));
      const winMax = WINS.map((w) => {
        const st = winStart(w);
        return { w, st, mx: Math.max(...yrs.filter((x) => x.y >= st).map((x) => x.tot)) };
      });
      const mx10 = winMax.find((x) => x.w === 10)!.mx;

      let cols = "";
      for (const { y, tot: yt } of yrs) {
        const ry = y === RY_YR;
        const hvars = winMax.map((wm) => `--h${wm.w}:${dround((divide(yt, wm.mx) ?? 0) * PLOT_H)}px;`).join("");
        const dcls = winMax.filter((wm) => wm.st <= y).map((wm) => `d${wm.w}`).join(" ");
        const h10 = dround((divide(yt, mx10) ?? 0) * PLOT_H);

        const valY = rk.map((m) => {
          const c = cell(dm, m.dim, y);
          return { ...m, val: metricOf(c, mt), sec: secOf(c, mt) };
        });
        const rkY = valY.map((m) => ({
          ...m,
          rankY:
            m.val <= 0
              ? 99999
              : valY.filter((o) => o.val > 0 && (o.val > m.val || (o.val === m.val && o.rank <= m.rank))).length,
        }));
        const visA = rkY.filter((m) => m.val > 0);
        const topRkA = visA.length ? Math.max(...visA.map((m) => m.rank)) : -1;
        const vis8 = rkY.filter((m) => m.val > 0 && m.rankY <= N_TOP);
        const topRk8 = vis8.length ? Math.max(...vis8.map((m) => m.rank)) : -1;
        const tail = rkY.filter((m) => m.rankY > N_TOP && m.val > 0);
        const othA = sum(tail, (m) => m.val);
        const othN = tail.length;
        const hasOth = othN > 0 && othA > 0;

        const lbl =
          mt === "S"
            ? int(yt)
            : yt >= 1000000
              ? short(yt, "M", 2, isD)
              : yt >= 1000
                ? short(yt, "K", 0, isD)
                : isD ? money(yt) : int(yt);
        const pyt = ry
          ? mt === "V" ? RYQLY : mt === "S" ? RYKLY : RYVLY
          : (yrs.find((x) => x.y === y - 1)?.tot ?? null);
        const vp = divide(yt - (pyt ?? 0), pyt);
        const vtx = y === FIRST_YEAR || vp === null ? "&middot;" : (vp >= 0 ? "&#9650; " : "&#9660; ") + pct(Math.abs(vp));
        const vcl = y === FIRST_YEAR || vp === null ? "#D2C8BC" : vp >= 0 ? POS : NEG;

        const segs = [...rkY]
          .sort((a, b) => a.rank - b.rank)
          .filter((m) => m.val > 0)
          .map((m) => {
            const { clr, lgt } = ramp(m.rank, cnt);
            const ink = lgt < 52 ? "#FFFFFF" : "#2B2024";
            const shr = divide(m.val, yt) ?? 0;
            const sh = shr * h10;
            const svt = mt === "V" ? int(m.sec) + " " + tc.sku(m.sec) : csText(m.sec);
            const at = isD ? money(m.val) : int(m.val);
            const txt =
              `<div class='sgi${sh >= 14 ? "" : " hid"}'>` +
              `<div>${pct(shr, 0)}</div>` +
              (sh >= 32 || sh < 14 ? `<div class='sgs'>${svt}</div>` : "") +
              "</div>";
            const tip = `${esc(m.dim)} &middot; ${at} &middot; ${pct(shr)} &middot; ${svt}`;
            const cls =
              "sgm" +
              (m.rankY > N_TOP ? " tl" : "") +
              (m.rank === topRkA ? " capA" : "") +
              (!hasOth && m.rank === topRk8 ? " cap8" : "");
            return `<div class='${cls}' data-t='${tip}' style='flex:${Math.max(dround(m.val), 1)} 0 0;background:${clr};color:${ink};'>${txt}</div>`;
          })
          .join("");

        const othShr = divide(othA, yt) ?? 0;
        const othSh = othShr * h10;
        const othList = [...tail]
          .sort((a, b) => b.val - a.val)
          .slice(0, N_TIP)
          .map((m) => `${esc(m.dim)}   ${isD ? money(m.val) : int(m.val)}   ${pct(divide(m.val, yt))}`)
          .join("&#10;");
        const othMore = othN > N_TIP ? `&#10;${tc.more(int(othN - N_TIP))}` : "";
        const othTip =
          `${tc.other} &middot; ${int(othN)} ${tc.members} &middot; ${isD ? money(othA) : int(othA)} &middot; ${pct(othShr)}&#10;&#10;` +
          othList +
          othMore;
        const othTxt =
          `<div class='sgi${othSh >= 14 ? "" : " hid"}'>` +
          `<div>${pct(othShr, 0)}</div>` +
          (othSh >= 32 || othSh < 14 ? `<div class='sgs'>${int(othN)} ${tc.members}</div>` : "") +
          "</div>";
        const othBlk = hasOth
          ? `<div class='sgm oth cap8' data-t='${othTip}' style='flex:${Math.max(dround(othA), 1)} 0 0;background:${CO};color:#FFFFFF;'>${othTxt}</div>`
          : "";

        cols +=
          `<div class='ccol ${dcls}${ry ? " ry" : ""}'>` +
          `<div class='clab'>${lbl}</div>` +
          `<div class='cvar' style='color:${vcl};'>${vtx}</div>` +
          `<div class='stk' style='${hvars}'>${segs}${othBlk}</div>` +
          `<div class='cyr'>${ry ? t.ryTy : y}</div>` +
          "</div>";
      }
      panels += `<div class='mqp p${dm}${mt}'><div class='wrow'>${cols}</div></div>`;
    }
  }

  // ------------- 4 · MIX STRIP · sales $ + volume + SKUs (RY TY) -------------
  const mixHead =
    "<div style='display:flex;align-items:center;gap:6px;padding:0 6px 3px 0;'>" +
    "<div style='width:88px;'></div><div style='flex:1;'></div>" +
    `<div class='skh' style='width:58px;text-align:right;'>${tc.volume}</div>` +
    `<div class='skh' style='width:36px;text-align:right;'>${t.skus}</div>` +
    `<div class='skh' style='width:68px;text-align:right;'>${t.sales}</div>` +
    `<div class='skh' style='width:38px;text-align:right;'>${tc.share}</div>` +
    "</div>";
  const mixLists = DIMS.map((dm) => {
    const t = ryMix.filter((m) => m.dm === dm).sort((a, b) => b.V - a.V || b.Q - a.Q);
    const tot = sum(t, (m) => m.V);
    const mx = Math.max(...t.map((m) => m.V));
    const cnt = members[dm].size;
    const body = t
      .map((m) => {
        const q = m.Q;
        const qt = q >= 1000000 ? short(q, "M", 1) : q >= 10000 ? short(q, "K", 1) : int(q);
        const rank = dimRank[dm].get(m.dim)!;
        const { clr } = ramp(rank, cnt);
        const tail = rank > N_TOP ? "<span class='mxo'>&middot;</span>" : "";
        return (
          "<div class='mxr'>" +
          `<div class='mxn'><span class='mxs' style='background:${clr};'></span>` +
          `<span class='mxt'>${esc(m.dim)}</span>${tail}</div>` +
          `<div class='mxb'><div class='mxf' style='width:${cssNum((divide(m.V, mx) ?? 0) * 100)}%;background:${clr};'></div></div>` +
          `<div class='num mxv'>${qt}</div>` +
          `<div class='num mxk'>${int(m.K)}</div>` +
          `<div class='num mxd'>${money(m.V)}</div>` +
          `<div class='num mxp'>${pct(divide(m.V, tot) ?? 0)}</div>` +
          "</div>"
        );
      })
      .join("");
    return `<div class='mqm m${dm}'>${body}</div>`;
  }).join("");

  // --------------------------- 5 · TOP SKU PRESETS ----------------------------
  const skus = rows.map((r) => {
    const launch = parseInsertion(r.ins);
    const v = divide(r.d - r.dL, r.dL);
    const growOk = GROW_TYPES.includes(r.type) && r.dL >= MIN_BASE_LY && v !== null;
    return {
      r,
      launch,
      v,
      s: [
        r.d,
        r.type === "SA" && launch ? launch.getTime() : null,
        r.type === "SL" && launch ? launch.getTime() : null,
        growOk && v! > 0 ? v : null,
        growOk && v! < 0 ? -v! : null,
      ] as N[],
    };
  });
  let skuRows = "";
  let emptyRows = "";
  for (let g = 1; g <= 5; g++) {
    const top = skus
      .filter((x) => x.s[g - 1] !== null)
      .sort((a, b) => b.s[g - 1]! - a.s[g - 1]! || b.r.d - a.r.d)
      .slice(0, N_SKU);
    if (!top.length) {
      emptyRows += `<tr class='skr sk${g}'><td colspan='4' class='skempty'>${tc.noSkus}</td></tr>`;
      continue;
    }
    top.forEach((x, i) => {
      const sub = (g === 2 || g === 3) && x.launch ? `<div class='skd'>${mdy(x.launch)}</div>` : "";
      skuRows +=
        `<tr class='skr sk${g}'>` +
        `<td class='skc skn'><span class='num skx'>${i + 1}</span></td>` +
        `<td class='skc skm'><div class='sknm'>${esc(x.r.desc)}</div>${sub}</td>` +
        `<td class='skc sks'><span class='num'>${money(x.r.d)}</span></td>` +
        `<td class='skc skv'><span class='num' style='color:${varColor(x.v)};'>${varArrow(x.v)} ${varText(x.v, t.na)}</span></td>` +
        "</tr>";
    });
  }
  const skuTable =
    "<table class='skt'>" +
    "<colgroup><col style='width:18px;'><col><col style='width:96px;'><col style='width:62px;'></colgroup>" +
    "<thead><tr><th class='skh'></th><th class='skh' style='text-align:left;'></th>" +
    `<th class='skh' style='text-align:right;padding-bottom:4px;'>${t.sales}</th>` +
    `<th class='skh' style='text-align:right;padding:0 0 4px 6px;'>${t.vsLy}</th></tr></thead>` +
    `<tbody>${skuRows}${emptyRows}</tbody></table>`;

  // -------------------------- 6 · SEGMENT BREAKDOWN ---------------------------
  const segRow = (cls: string, name: string, skus: number, vol: number, volLY: number, sal: number, salLY: number) => {
    const sv = divide(sal - salLY, salLY);
    const vv = divide(vol - volLY, volLY);
    return (
      `<tr class='sgr ${cls}'>` +
      `<td class='sgc sgn${cls === "sgC" ? " sgnc" : ""}'><span class='${cls === "sgC" ? "sgcl" : "sgtl"}'>${esc(name)}</span></td>` +
      `<td class='sgc sgk'><span class='num'>${int(skus)}</span></td>` +
      `<td class='sgc sgv'><span class='num'>${int(vol)}</span></td>` +
      `<td class='sgc sgd'><span class='num' style='color:${varColor(vv)};'>${varArrow(vv)}${varText(vv, t.na)}</span></td>` +
      `<td class='sgc sgs'><span class='num'>${money(sal)}</span></td>` +
      `<td class='sgc sgd2'><span class='num' style='color:${varColor(sv)};'>${varArrow(sv)}${varText(sv, t.na)}</span></td>` +
      "</tr>"
    );
  };
  const segBlocks = [...groupBy(rows, (r) => T(r.segment)).entries()]
    .map(([seg, rs]) => ({ seg, rs, S: sum(rs, (r) => r.d), SLY: sum(rs, (r) => r.dL) }))
    .filter((x) => x.S > 0 || x.SLY > 0)
    .sort((a, b) => b.S - a.S)
    .slice(0, SEG_MAX)
    .map(({ seg, rs, S, SLY }) => {
      const volTY = sum(rs, (r) => r.ry);
      const volLY = sum(rs, (r) => r.ryL);
      const sv = divide(S - SLY, SLY);
      const vv = divide(volTY - volLY, volLY);
      const typeRows = TYPE_LIST.map((t) => {
        const tr = rs.filter((r) => r.type === t);
        if (!tr.length) return "";
        return segRow("sgT", shortType[t], new Set(tr.map((r) => r.code)).size, sum(tr, (r) => r.ry), sum(tr, (r) => r.ryL), sum(tr, (r) => r.d), sum(tr, (r) => r.dL));
      }).join("");
      const catRows = [...groupBy(rs, (r) => T(r.category)).entries()]
        .map(([c, cr]) => ({ c, cr, sal: sum(cr, (r) => r.d) }))
        .sort((a, b) => b.sal - a.sal)
        .slice(0, N_CAT)
        .map(({ c, cr }) => segRow("sgC", c, new Set(cr.map((r) => r.code)).size, sum(cr, (r) => r.ry), sum(cr, (r) => r.ryL), sum(cr, (r) => r.d), sum(cr, (r) => r.dL)))
        .join("");
      return (
        "<div class='sgblk'>" +
        `<div class='sghd'>${esc(seg)}</div>` +
        "<table class='skt'>" +
        "<colgroup><col style='width:26%;'><col style='width:10%;'><col style='width:16%;'><col style='width:12%;'><col style='width:22%;'><col style='width:14%;'></colgroup>" +
        "<thead><tr>" +
        `<th class='skh' style='text-align:left;padding-bottom:4px;'><span class='sgclab'>${tc.category}</span></th>` +
        `<th class='skh' style='text-align:right;padding-bottom:4px;'>${t.skus}</th>` +
        `<th class='skh' style='text-align:right;padding-bottom:4px;'>${tc.vol}</th>` +
        "<th class='skh' style='text-align:right;padding-bottom:4px;'>&Delta;</th>" +
        `<th class='skh' style='text-align:right;padding-bottom:4px;'>${t.sales}</th>` +
        "<th class='skh' style='text-align:right;padding-bottom:4px;'>&Delta;</th>" +
        "</tr></thead><tbody>" +
        "<tr class='sgtot'>" +
        `<td class='sgn'><span class='num'>${tc.total}</span></td>` +
        `<td class='sgk'><span class='num'>${int(new Set(rs.map((r) => r.code)).size)}</span></td>` +
        `<td class='sgv'><span class='num'>${int(volTY)}</span></td>` +
        `<td class='sgd'><span class='num' style='color:${varColor(vv)};'>${varArrow(vv)}${varText(vv, t.na)}</span></td>` +
        `<td class='sgs'><span class='num'>${money(S)}</span></td>` +
        `<td class='sgd2'><span class='num' style='color:${varColor(sv)};'>${varArrow(sv)}${varText(sv, t.na)}</span></td>` +
        "</tr>" +
        typeRows +
        catRows +
        "</tbody></table></div>"
      );
    })
    .join("");

  // ------------------------------- 7 · STYLE ----------------------------------
  const F = FONT;
  const style =
    "<style>" +
    "html,body{margin:0;padding:0;background:#F6F3EE;}" +
    ".mq,.mq *{box-sizing:border-box;}" +
    ".mqr{position:absolute;opacity:0;width:0;height:0;pointer-events:none;}" +
    ".num{font-variant-numeric:tabular-nums;font-feature-settings:'tnum';}" +
    ".seg{display:flex;gap:3px;background:#ECE5DB;border-radius:16px;padding:3px;flex:none;}" +
    `.seg label{cursor:pointer;font:700 9.5px ${F};letter-spacing:.4px;color:#6B625B;border-radius:13px;padding:5px 11px;white-space:nowrap;-webkit-user-select:none;user-select:none;}` +
    ".seg label:hover{color:#2B2024;}" +
    ".skbar label,.mvbar label,.tpbar label{padding:5px 8px;}" +
    ".card{background:#FFFFFF;border-radius:12px;box-shadow:0 1px 3px rgba(43,32,36,.10);padding:12px 14px;}" +
    `.eyebrow{font:700 8.5px ${F};letter-spacing:.9px;color:#A69C92;text-transform:uppercase;}` +
    ".kpi{flex:1;background:#FFFFFF;border-radius:10px;padding:8px 11px;box-shadow:0 1px 3px rgba(43,32,36,.10);min-width:0;}" +
    `.kval{font:800 19px ${F};color:#2B2024;margin-top:1px;line-height:1.05;white-space:nowrap;}` +
    `.kvar{font:700 11px ${F};margin-top:2px;white-space:nowrap;}` +
    ".skt{width:100%;border-collapse:collapse;table-layout:fixed;}" +
    `.skh{font:700 8.5px ${F};letter-spacing:.5px;color:#A69C92;text-transform:uppercase;}` +
    ".skc{border-bottom:1px solid #F3EEE7;vertical-align:top;}" +
    ".skn{padding:6px 0;}" +
    `.skx{font:700 9px ${F};color:#C5BBB0;}` +
    ".skm{padding:6px 6px 6px 0;}" +
    `.sknm{font:600 12px ${F};color:#2B2024;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}` +
    `.skd{font:500 9.5px ${F};color:#A69C92;margin-top:1px;}` +
    `.sks{padding:6px;text-align:right;white-space:nowrap;font:700 12px ${F};color:#2B2024;}` +
    `.skv{padding:6px 0 6px 6px;text-align:right;white-space:nowrap;font:700 10px ${F};}` +
    `.skempty{font:11px ${F};color:#A69C92;padding:12px 0;}` +
    ".sgc{border-bottom:1px solid #F0EBE4;white-space:nowrap;}" +
    ".sgblk{background:#FCFAF7;border:1px solid #F0EBE4;border-radius:10px;padding:9px 11px;margin-bottom:8px;}" +
    `.sghd{font:800 10px ${F};color:#2B2024;text-transform:uppercase;letter-spacing:.9px;margin-bottom:5px;}` +
    ".sgn{padding:4px 6px 4px 0;text-align:left;}" +
    ".sgnc{overflow:hidden;text-overflow:ellipsis;}" +
    `.sgtl{font:700 10px ${F};color:#6B625B;letter-spacing:.3px;}` +
    `.sgcl{font:600 10px ${F};color:#6B625B;}` +
    `.sgk{padding:4px 6px;text-align:right;font:10px ${F};color:#6B625B;}` +
    `.sgv{padding:4px 6px;text-align:right;font:10px ${F};color:#2B2024;}` +
    `.sgd,.sgd2{text-align:right;font:700 9px ${F};}` +
    ".sgd{padding:4px 4px;}" +
    ".sgd2{padding:4px 0 4px 4px;}" +
    `.sgs{padding:4px 6px;text-align:right;font:700 10px ${F};color:#2B2024;}` +
    `.sgtot td{border-bottom:2px solid #E6DED3;font:800 11px ${F};color:#2B2024;padding-top:5px;padding-bottom:5px;}` +
    `.sgtot .sgd,.sgtot .sgd2{font:700 9px ${F};}` +
    ".mxr{display:flex;align-items:center;gap:6px;margin-bottom:3px;}" +
    ".mxn{width:88px;display:flex;align-items:center;gap:6px;min-width:0;}" +
    ".mxs{width:10px;height:10px;border-radius:3px;flex:none;}" +
    `.mxt{font:11px ${F};color:#2B2024;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}` +
    `.mxo{color:#C5BBB0;font:700 11px ${F};flex:none;}` +
    ".mxb{flex:1;height:7px;border-radius:4px;background:#E9E2D8;overflow:hidden;}" +
    ".mxf{height:7px;border-radius:4px;}" +
    `.mxv{width:58px;text-align:right;font:10.5px ${F};color:#6B625B;}` +
    `.mxk{width:36px;text-align:right;font:10.5px ${F};color:#6B625B;}` +
    `.mxd{width:68px;text-align:right;font:700 11px ${F};color:#2B2024;}` +
    `.mxp{width:38px;text-align:right;font:700 10.5px ${F};color:#2B2024;}` +
    ".scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:6px;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#D9CFC3 transparent;}" +
    ".scroll::-webkit-scrollbar{width:6px;}" +
    ".scroll::-webkit-scrollbar-track{background:transparent;}" +
    ".scroll::-webkit-scrollbar-thumb{background:#D9CFC3;border-radius:3px;}" +
    ".scroll::-webkit-scrollbar-thumb:hover{background:#BFB2A4;}" +
    `.wrow{display:flex;gap:8px;align-items:flex-end;width:100%;height:${PLOT_H + 58}px;}` +
    ".ccol{display:none;flex:1;flex-direction:column;align-items:center;justify-content:flex-end;}" +
    ".ccol.ry{border-left:1px dashed #D2C8BC;margin-left:5px;padding-left:9px;}" +
    `.clab{font:600 11px ${F};color:#6B625B;}` +
    ".ccol.ry .clab{color:#2B2024;}" +
    `.cvar{font:600 10px ${F};margin:1px 0 5px 0;}` +
    `.cyr{margin-top:5px;font:600 11px ${F};color:#2B2024;white-space:nowrap;}` +
    `.ccol.ry .cyr{font-weight:800;color:${C2};}` +
    ".stk{display:flex;flex-direction:column-reverse;width:100%;max-width:54px;border-radius:5px 5px 0 0;height:var(--h10);}" +
    `.sgm{position:relative;display:flex;min-height:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.92);cursor:default;font:700 10px ${F};transition:min-height .12s ease;}` +
    ".sgi{flex:1 1 auto;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;text-align:center;line-height:1.12;}" +
    ".sgi .sgs{font-weight:400;font-size:9px;opacity:.82;padding:0;color:inherit;text-align:center;}" +
    ".hid{visibility:hidden;}" +
    ".sgm:hover .hid{visibility:visible;}" +
    ".sgm:hover{z-index:9;min-height:34px;box-shadow:inset 0 1px 0 rgba(255,255,255,.92),inset 0 0 0 1px rgba(255,255,255,.85);}" +
    ".sgm:hover::after{content:attr(data-t);position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);" +
    `background:#2B2024;color:#FFFFFF;font:600 10.5px ${F};letter-spacing:.1px;padding:5px 8px;border-radius:6px;` +
    "white-space:nowrap;box-shadow:0 3px 12px rgba(43,32,36,.30);pointer-events:none;z-index:9;}" +
    ".sgm:hover::before{content:'';position:absolute;left:50%;bottom:100%;transform:translateX(-50%);border:5px solid transparent;border-top-color:#2B2024;pointer-events:none;z-index:9;}" +
    ".oth:hover::after{white-space:pre;text-align:left;line-height:1.45;padding:7px 10px;font-variant-numeric:tabular-nums;}" +
    ".wrow>.ccol:first-child .sgm:hover::after{left:0;transform:none;}" +
    ".wrow>.ccol:last-child .sgm:hover::after{left:auto;right:0;transform:none;}" +
    ".mqp,.mqm,.wlab,.gCard,.cCard,.skr,.sgr,.sgclab{display:none;}" +
    "#mp3:checked ~ .mqx label[for=mp3],#mp5:checked ~ .mqx label[for=mp5],#mp10:checked ~ .mqx label[for=mp10]," +
    "#mqA:checked ~ .mqx label[for=mqA],#mqB:checked ~ .mqx label[for=mqB],#mqC:checked ~ .mqx label[for=mqC]," +
    "#mvV:checked ~ .mqx label[for=mvV],#mvS:checked ~ .mqx label[for=mvS],#mvD:checked ~ .mqx label[for=mvD]," +
    "#sk1:checked ~ .mqx label[for=sk1],#sk2:checked ~ .mqx label[for=sk2]," +
    "#sk3:checked ~ .mqx label[for=sk3],#sk4:checked ~ .mqx label[for=sk4]," +
    "#sk5:checked ~ .mqx label[for=sk5]," +
    "#sgT:checked ~ .mqx label[for=sgT],#sgC:checked ~ .mqx label[for=sgC]," +
    "#tp8:checked ~ .mqx label[for=tp8],#tpA:checked ~ .mqx label[for=tpA]" +
    "{background:#2B2024;color:#FFFFFF;box-shadow:0 1px 2px rgba(43,32,36,.25);}" +
    "#mqA:checked ~ #mvV:checked ~ .mqx .pAV," +
    "#mqB:checked ~ #mvV:checked ~ .mqx .pBV," +
    "#mqC:checked ~ #mvV:checked ~ .mqx .pCV," +
    "#mqA:checked ~ #mvS:checked ~ .mqx .pAS," +
    "#mqB:checked ~ #mvS:checked ~ .mqx .pBS," +
    "#mqC:checked ~ #mvS:checked ~ .mqx .pCS," +
    "#mqA:checked ~ #mvD:checked ~ .mqx .pAD," +
    "#mqB:checked ~ #mvD:checked ~ .mqx .pBD," +
    "#mqC:checked ~ #mvD:checked ~ .mqx .pCD{display:block;}" +
    "#mqA:checked ~ .mqx .mA,#mqB:checked ~ .mqx .mB,#mqC:checked ~ .mqx .mC{display:block;}" +
    "#mp3:checked ~ .mqx .d3,#mp5:checked ~ .mqx .d5,#mp10:checked ~ .mqx .d10{display:flex;}" +
    "#mp3:checked ~ .mqx .stk{height:var(--h3);}" +
    "#mp5:checked ~ .mqx .stk{height:var(--h5);}" +
    "#mp10:checked ~ .mqx .stk{height:var(--h10);}" +
    "#mp3:checked ~ .mqx .l3,#mp5:checked ~ .mqx .l5,#mp10:checked ~ .mqx .l10{display:inline;}" +
    "#mp3:checked ~ .mqx .g3,#mp3:checked ~ .mqx .c3," +
    "#mp5:checked ~ .mqx .g5,#mp5:checked ~ .mqx .c5," +
    "#mp10:checked ~ .mqx .g10,#mp10:checked ~ .mqx .c10{display:block;}" +
    "#tp8:checked ~ .mqx .tl{display:none;}" +
    "#tpA:checked ~ .mqx .oth{display:none;}" +
    "#tpA:checked ~ .mqx .capA,#tp8:checked ~ .mqx .cap8{border-radius:5px 5px 0 0;}" +
    "#sk1:checked ~ .mqx .sk1,#sk2:checked ~ .mqx .sk2," +
    "#sk3:checked ~ .mqx .sk3,#sk4:checked ~ .mqx .sk4," +
    "#sk5:checked ~ .mqx .sk5{display:table-row;}" +
    "#sgT:checked ~ .mqx .sgT,#sgC:checked ~ .mqx .sgC{display:table-row;}" +
    "#sgC:checked ~ .mqx .sgclab{display:inline;}" +
    "</style>";

  // radio order matters: mp* -> mq* -> mv* -> sk* -> sg* -> tp*
  const radios =
    "<input class='mqr' type='radio' name='mptab' id='mp3'>" +
    "<input class='mqr' type='radio' name='mptab' id='mp5'>" +
    "<input class='mqr' type='radio' name='mptab' id='mp10' checked>" +
    "<input class='mqr' type='radio' name='mqtab' id='mqA' checked>" +
    "<input class='mqr' type='radio' name='mqtab' id='mqB'>" +
    "<input class='mqr' type='radio' name='mqtab' id='mqC'>" +
    "<input class='mqr' type='radio' name='mvtab' id='mvV' checked>" +
    "<input class='mqr' type='radio' name='mvtab' id='mvS'>" +
    "<input class='mqr' type='radio' name='mvtab' id='mvD'>" +
    "<input class='mqr' type='radio' name='sktab' id='sk1' checked>" +
    "<input class='mqr' type='radio' name='sktab' id='sk2'>" +
    "<input class='mqr' type='radio' name='sktab' id='sk3'>" +
    "<input class='mqr' type='radio' name='sktab' id='sk4'>" +
    "<input class='mqr' type='radio' name='sktab' id='sk5'>" +
    "<input class='mqr' type='radio' name='sgtab' id='sgT' checked>" +
    "<input class='mqr' type='radio' name='sgtab' id='sgC'>" +
    "<input class='mqr' type='radio' name='tptab' id='tp8' checked>" +
    "<input class='mqr' type='radio' name='tptab' id='tpA'>";

  // ------------------------------ 8 · HEADER + KPI ----------------------------
  const header =
    "<div style='display:flex;justify-content:space-between;align-items:center;gap:10px;height:40px;'>" +
    `<div style='font:800 19px ${F};color:#2B2024;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;'>${esc(tc.portfolio(OUR_AGENT))}</div>` +
    // demo: the growth window is fixed at 10 yrs (radio stays checked, no pills)
    "</div>";

  const gCard = (w: number, g: number) => {
    const c = g >= 0 ? POS : NEG;
    return `<div class='kpi gCard g${w}' style='border-left:4px solid ${c};'><div class='eyebrow'>${tc.growth(w)}</div><div class='kval num' style='color:${c};'>${g >= 0 ? "&#9650; " : "&#9660; "}${pct(Math.abs(g))}</div></div>`;
  };
  const cCard = (w: number, v: N) =>
    `<div class='kpi cCard c${w}' style='border-left:4px solid #C48A93;'><div class='eyebrow'>${tc.cagr(w)}</div><div class='kval num'>${pct(v)}</div></div>`;
  const kpiRow =
    "<div style='display:flex;gap:8px;height:66px;margin-top:8px;'>" +
    `<div class='kpi' style='border-left:4px solid #2B2024;'><div class='eyebrow'>${tc.salesRyTy}</div>` +
    `<div class='kval num'>${money(TY)}</div>` +
    `<div class='kvar num' style='color:${varColor(VP)};'>${varArrow(VP)} ${varText(VP, t.na)}</div></div>` +
    `<div class='kpi' style='border-left:4px solid #7A1F2E;'><div class='eyebrow'>${tc.volumeRyTy}</div>` +
    `<div class='kval num'>${int(TYcs)}</div>` +
    `<div class='kvar num' style='color:${varColor(VPcs)};'>${varArrow(VPcs)} ${varText(VPcs, t.na)}</div></div>` +
    gCard(3, growth3) +
    gCard(5, growth5) +
    gCard(10, growth10) +
    cCard(3, cagr3) +
    cCard(5, cagr5) +
    cCard(10, cagr10) +
    `<div class='kpi' style='border-left:4px solid #9C9188;'><div class='eyebrow'>${tc.activeSkus}</div><div class='kval num'>${int(totalSKUs)}</div></div>` +
    `<div class='kpi' style='border-left:4px solid #9C9188;'><div class='eyebrow'>${tc.suppliers}</div><div class='kval num'>${int(activeSupps)}</div></div>` +
    `<div class='kpi' style='border-left:4px solid #9C9188;'><div class='eyebrow'>${tc.agencyRank}</div><div class='kval num'>${int(agentRank)}${ordinal(agentRank)}</div></div>` +
    "</div>";

  // ------------------------------- 9 · BODY -----------------------------------
  const leftCol =
    "<div style='flex:1.55 1 0;min-width:0;height:560px;'>" +
    "<div class='card' style='height:100%;display:flex;flex-direction:column;'>" +
    "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;'>" +
    "<div style='display:flex;align-items:center;gap:6px;min-width:0;'>" +
    `<div class='seg'>${DIMS.map((d, i) => `<label for='mq${d}'>${tc.dims[i]}</label>`).join("")}</div>` +
    // demo: stack depth is fixed at Top 8 + Other (radio stays checked, no pills)
    "</div>" +
    "<div style='display:flex;align-items:center;gap:8px;'>" +
    `<span class='eyebrow'>${rangeLbl}</span>` +
    `<div class='seg mvbar'>${METRICS.map((m, i) => `<label for='mv${m}'>${tc.metrics[i]}</label>`).join("")}</div>` +
    "</div>" +
    "</div>" +
    panels +
    "<div style='margin-top:auto;padding-top:8px;border-top:1px solid #F1ECE5;'>" +
    `<div class='eyebrow' style='margin-bottom:3px;'>${tc.mix}</div>` +
    mixHead +
    `<div class='scroll' style='height:${MIX_H}px;flex:none;'>${mixLists}</div>` +
    "</div>" +
    "</div>" +
    "</div>";

  const rightCol =
    "<div style='flex:1 1 0;min-width:0;height:560px;display:flex;flex-direction:column;gap:8px;'>" +
    "<div class='card' style='height:236px;display:flex;flex-direction:column;overflow:hidden;'>" +
    "<div class='seg skbar' style='margin-bottom:8px;width:100%;flex-wrap:wrap;justify-content:center;gap:4px;row-gap:3px;'>" +
    tc.presets.map(([label, title], i) => `<label for='sk${i + 1}'${title ? ` title='${title}'` : ""}>${label}</label>`).join("") +
    "</div>" +
    `<div class='scroll'>${skuTable}</div>` +
    "</div>" +
    "<div class='card' style='height:316px;display:flex;flex-direction:column;overflow:hidden;'>" +
    "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;flex:none;'>" +
    `<span class='eyebrow'>${tc.segments}</span>` +
    `<div class='seg'><label for='sgT'>${tc.byType}</label><label for='sgC'>${tc.byCategory}</label></div>` +
    "</div>" +
    `<div class='scroll'>${segBlocks}</div>` +
    "</div>" +
    "</div>";

  // ------------------------------ 10 · ASSEMBLE -------------------------------
  return (
    `<div class='mq' style='font-family:${F};background:#F6F3EE;padding:10px 12px;border-radius:14px;overflow:hidden;'>` +
    style +
    radios +
    "<div class='mqx'>" +
    header +
    kpiRow +
    `<div style='display:flex;gap:10px;align-items:stretch;margin-top:8px;'>${leftCol}${rightCol}</div>` +
    "</div>" +
    "</div>"
  );
}
