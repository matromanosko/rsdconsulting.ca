import type { CSSProperties } from "react";
import HoursSaved from "./HoursSaved";
import { FIRST_YEAR, OUR_AGENT, getRows } from "@/app/lib/dashboards/data";
import { int, pct, short, withLang } from "@/app/lib/dashboards/format";
import { term } from "@/app/lib/dashboards/i18n";
import type { Lang } from "@/app/lib/i18n/config";
import { dict } from "@/app/lib/i18n/dictionaries";

// Hero "dashboard cards" in a bento grid, drawn from the same mock dataset as
// the embedded demos so the numbers line up. Entrance and chart animations
// are the .hero-* classes in globals.css; --d staggers each one.

function fmtMoney(x: number) {
  return x >= 1_000_000 ? short(x, "M", 1, true) : short(x, "K", 0, true);
}

function linePath(values: number[], w: number, h: number, pad = 4) {
  const max = Math.max(...values);
  const min = Math.min(...values) * 0.85;
  const step = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => [pad + i * step, h - pad - ((v - min) / (max - min)) * (h - pad * 2)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  return { line, area, last: pts[pts.length - 1] };
}

export default function HeroCards({ lang = "en" }: { lang?: Lang }) {
  // called, not rendered, so the numbers format while withLang is active
  return withLang(lang, () => cards(lang));
}

function cards(lang: Lang) {
  const t = dict(lang).hero;
  const rows = getRows().filter((r) => r.agent === OUR_AGENT);
  const years = rows[0].hist.map((_, i) => FIRST_YEAR + i);
  const cases = years.map((_, i) => rows.reduce((s, r) => s + r.hist[i], 0));
  const dollars = years.map((_, i) => rows.reduce((s, r) => s + r.histD[i], 0));
  const ty = rows.reduce((s, r) => s + r.d, 0);
  const ly = rows.reduce((s, r) => s + r.dL, 0);
  const vp = (ty - ly) / ly;
  const ry = rows.reduce((s, r) => s + r.ry, 0);
  const ryL = rows.reduce((s, r) => s + r.ryL, 0);

  const channels = [
    { label: t.channels[0], v: rows.reduce((s, r) => s + r.c1, 0), color: "var(--accent)" },
    { label: t.channels[1], v: rows.reduce((s, r) => s + r.c2, 0), color: "#b9737d" },
    { label: t.channels[2], v: rows.reduce((s, r) => s + r.c3, 0), color: "#d9b8b8" },
    { label: t.channels[3], v: rows.reduce((s, r) => s + r.c4, 0), color: "#e9e2d6" },
  ];
  const chTot = channels.reduce((s, c) => s + c.v, 0);
  const R = 15.9155; // circumference 100
  let offset = 25;

  const trend = linePath([...cases, ry], 300, 96);
  const spark = linePath(dollars, 120, 40, 2);

  const card = "hero-card rounded-xl border border-border bg-surface p-4 shadow-[0_8px_30px_rgba(22,21,20,0.08)]";
  const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

  return (
    <div className="mx-auto grid w-full max-w-md gap-4 sm:max-w-none sm:grid-cols-2">
      {/* trend card */}
      <div aria-hidden className={`${card} sm:col-span-2`} style={delay(0)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><path d="M2 13h12M4 10v2M7 7v5M10 9v3M13 4v8" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
            </span>
            <div>
              <p className="text-xs font-semibold">{t.depletions}</p>
              <p className="text-[10px] text-muted">
                {term(lang, OUR_AGENT)} · {FIRST_YEAR}–2025 + {t.span}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-band px-2 py-0.5 text-[10px] text-muted">{t.years}</span>
        </div>
        <svg viewBox="0 0 300 96" className="mt-3 h-24 w-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="hero-reveal" style={delay(250)}>
            <path d={trend.area} fill="url(#heroFill)" />
            <path d={trend.line} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
        {/* end dot sits outside the stretched SVG so it stays round */}
        <div className="relative -mt-24 h-24">
          <span
            className="hero-pop absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
            style={{ left: `${(trend.last[0] / 300) * 100}%`, top: `${(trend.last[1] / 96) * 100}%`, ...delay(1500) }}
          >
            <span className="hero-pulse absolute inset-0 rounded-full bg-accent" />
          </span>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          <span>{FIRST_YEAR}</span>
          <span>2020</span>
          <span>2025</span>
          <span className="font-semibold text-foreground">
            {t.ry} {short(ry, "K", 0)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* KPI card */}
        <div aria-hidden className={card} style={delay(150)}>
          <p className="text-xs font-semibold text-accent">{t.salesRy}</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{fmtMoney(ty)}</p>
          <p className={`text-[11px] font-medium ${vp >= 0 ? "text-[#12a150]" : "text-[#e5484d]"}`}>
            {vp >= 0 ? "▲" : "▼"} {pct(Math.abs(vp))}{" "}
            <span className="font-normal text-muted">
              vs {fmtMoney(ly)} {t.lastYear}
            </span>
          </p>
          <svg viewBox="0 0 120 40" className="mt-2 h-10 w-full" preserveAspectRatio="none">
            <g className="hero-reveal" style={delay(450)}>
              <path d={spark.line} fill="none" stroke="var(--ink)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </g>
          </svg>
          <p className="mt-1 text-[10px] text-muted">
            {int(ry)} {t.cases} · {ryL ? `${pct((ry - ryL) / ryL)} ${t.vsLy}` : ""}
          </p>
        </div>

        {/* hours saved counter */}
        <div className={`${card} py-3`} style={delay(450)}>
          <HoursSaved />
        </div>
      </div>

      {/* channel donut */}
      <div aria-hidden className={`${card} flex flex-col`} style={delay(300)}>
        <p className="text-xs font-semibold">{t.channelMix}</p>
        <p className="text-[10px] text-muted">{t.casesRy}</p>
        <svg viewBox="0 0 42 42" className="mx-auto my-4 h-28 w-28">
          <circle cx="21" cy="21" r={R} fill="none" stroke="var(--band)" strokeWidth="6" />
          {channels.map((c) => {
            const share = (c.v / chTot) * 100;
            const el = (
              <circle
                key={c.label}
                className="hero-sweep"
                cx="21"
                cy="21"
                r={R}
                fill="none"
                stroke={c.color}
                strokeWidth="6"
                strokeDasharray={`${share} ${100 - share}`}
                strokeDashoffset={offset}
                style={delay(500 + (25 - offset) * 9)}
              />
            );
            offset -= share;
            return el;
          })}
        </svg>
        <ul className="mt-auto flex flex-col gap-1.5 text-[11px]">
          {channels.map((c) => (
            <li key={c.label} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-2 w-2 rounded-sm" style={{ background: c.color }} />
              {c.label}
              <span className="ml-auto tabular-nums text-muted">{pct(c.v / chTot, 0)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
