import type { Metadata } from "next";
import type { ReactNode } from "react";
import HeroCards from "@/app/components/HeroCards";
import { Eyebrow, Hl, Mark } from "@/app/components/ui";
import { buildCommandCenter } from "@/app/lib/dashboards/commandCenter";
import { buildSupplierSpotlight } from "@/app/lib/dashboards/supplierSpotlight";
import { buildTable } from "@/app/lib/dashboards/tables";
import { featuredSupplier } from "@/app/lib/dashboards/data";
import { BRAND, TAGLINE } from "@/app/lib/brand";

// Five 16:9 slides of the home page, laid out for print. Open /deck and
// print (or run headless Chrome --print-to-pdf) to get the PDF.

export const metadata: Metadata = {
  title: `${BRAND} — Power BI for wine agencies (deck)`,
  robots: { index: false, follow: false },
};

const W = 1280;
const H = 720;

function Slide({ n, children, dark = false }: { n: number; children: ReactNode; dark?: boolean }) {
  return (
    <section
      className={`slide relative flex flex-col overflow-hidden px-16 pb-10 pt-12 ${dark ? "bg-ink text-white" : "bg-background"}`}
      style={{ width: W, height: H }}
    >
      <div className="flex flex-1 flex-col justify-center">{children}</div>
      <div className={`mt-6 flex items-center justify-between text-xs ${dark ? "text-white/50" : "text-muted"}`}>
        <span className="flex items-center gap-2 font-display font-medium">
          <Mark className="h-4 w-4" />
          {BRAND} · {TAGLINE}
        </span>
        <span>{n} / 5</span>
      </div>
    </section>
  );
}

// a measure's HTML at its design size, scaled into the slide
function Dash({ html, w, h, scale }: { html: string; w: number; h: number; scale: number }) {
  const doc =
    "<!doctype html><html><head><meta charset='utf-8'>" +
    "<style>html,body{margin:0;padding:0;background:#F6F3EE;}</style>" +
    `</head><body>${html}</body></html>`;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#F6F3EE] shadow-[0_8px_30px_rgba(22,21,20,0.08)]" style={{ width: w * scale, height: h * scale }}>
      <iframe
        title="dashboard"
        srcDoc={doc}
        style={{ width: w, height: h, border: 0, transform: `scale(${scale})`, transformOrigin: "0 0", display: "block" }}
      />
    </div>
  );
}

const h2 = "font-display text-[44px] font-medium leading-[1.08] tracking-tight";

export default function Deck() {
  const supplier = featuredSupplier();
  const command = buildCommandCenter();
  const spotlight = buildSupplierSpotlight(supplier);
  const table = buildTable("suppliers");

  return (
    <div className="deck">
      <style>{`
        @page { size: ${W}px ${H}px; margin: 0; }
        html, body { background: #d9d5ce; }
        .deck { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 24px 0; }
        @media print {
          html, body { background: none; }
          .deck { display: block; padding: 0; }
          .slide { break-after: page; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* 1 · title */}
      <Slide n={1}>
        <div className="grid grid-cols-2 items-center gap-14">
          <div className="flex flex-col gap-6">
            <Eyebrow>Power BI for wine agencies on ezFocus</Eyebrow>
            <h1 className="font-display text-[64px] font-medium leading-[1.03] tracking-tight">
              Turn your ezFocus data into <Hl>decisions</Hl>, not{" "}
              <span className="underline decoration-accent decoration-2 underline-offset-8">spreadsheets</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-muted">
              Power BI dashboards and supplier reports built on the sales you already track in ezFocus. They refresh
              on their own, so your team stops rebuilding them every month.
            </p>
            <p className="text-sm">
              <span className="rounded-full bg-ink px-5 py-2.5 font-medium text-white">mat@rsdconsulting.ca</span>
            </p>
          </div>
          <HeroCards />
        </div>
      </Slide>

      {/* 2 · the challenge */}
      <Slide n={2}>
        <div className="grid grid-cols-2 items-center gap-14">
          <div className="rounded-2xl bg-cream p-8">
            <p className="text-xs font-medium text-muted">A typical month-end, today</p>
            <ol className="mt-5 flex flex-col gap-3 font-mono text-sm">
              {[
                ["Export depletions from ezFocus", "x 1 per supplier"],
                ["Paste into the master workbook", "fix the formats"],
                ["Rebuild pivots & charts", "again"],
                ["Check the totals don't match", "find out why"],
                ["Make a deck for each producer", "send, repeat"],
              ].map(([a, b], i) => (
                <li key={a} className="flex items-baseline justify-between gap-4 rounded-md bg-surface/70 px-3 py-2">
                  <span>
                    <span className="mr-2 text-muted">{String(i + 1).padStart(2, "0")}</span>
                    {a}
                  </span>
                  <span className="shrink-0 text-accent">{b}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-6">
            <Eyebrow>The challenge</Eyebrow>
            <h2 className={h2}>
              Your data is <Hl>rich</Hl>. Your reports shouldn&apos;t take a week.
            </h2>
            <ul className="flex flex-col gap-2 text-lg text-muted">
              <li>• Days lost every month to exports, pasting and pivot tables</li>
              <li>• Meetings spent arguing about which number is right</li>
              <li>• Producers kept waiting for answers about their own wines</li>
            </ul>
          </div>
        </div>
        <div className="mt-12">
          <p className="text-xs font-medium">
            <Hl>Built around</Hl> the data you already keep in ezFocus
          </p>
          <ul className="mt-4 grid grid-cols-6 gap-6 border-t border-border pt-5">
            {[
              ["Depletions", "R1 · R3 · R6 · YTD · RY"],
              ["Listings", "Regular · specialty · batch-order"],
              ["Channels", "Retail · On premise · Restaurant supply · Agency"],
              ["Suppliers & brands", "Rank vs. the whole market"],
              ["Prices & distribution", "Points of sale · velocity"],
              ["Ten-year history", "Country · category · type"],
            ].map(([t, d]) => (
              <li key={t}>
                <p className="font-display text-base font-semibold tracking-tight">{t}</p>
                <p className="mt-0.5 text-xs text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </Slide>

      {/* 3 · agency dashboard */}
      <Slide n={3}>
        <div className="flex gap-10">
          <div className="flex w-[300px] shrink-0 flex-col justify-center gap-5">
            <Eyebrow>What we build · Agency view</Eyebrow>
            <h2 className="font-display text-[36px] font-medium leading-[1.1] tracking-tight">
              Your whole book on <Hl>one page</Hl>
            </h2>
            <ul className="flex flex-col gap-3 text-sm text-muted">
              <li>
                <b className="text-foreground">Rolling year, at a glance:</b> sales $, 9L cases, 3/5/10-year growth and
                CAGR.
              </li>
              <li>
                <b className="text-foreground">Ten-year trend</b> by country, category or listing type, in cases, SKUs
                or dollars.
              </li>
              <li>
                <b className="text-foreground">Top sellers, new listings,</b> growers and decliners, one click each.
              </li>
              <li>
                <b className="text-foreground">Every segment</b> broken down by listing type and top categories.
              </li>
            </ul>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <Dash html={command} w={1280} h={720} scale={0.66} />
          </div>
        </div>
      </Slide>

      {/* 4 · supplier reports + ranked tables */}
      <Slide n={4}>
        <Eyebrow>What we build · Supplier view</Eyebrow>
        <h2 className="mt-4 font-display text-[36px] font-medium leading-[1.1] tracking-tight">
          Producer-ready reports, <Hl>in one click</Hl>
        </h2>
        <div className="mt-7 grid grid-cols-2 gap-8">
          <figure className="flex flex-col gap-3">
            <Dash html={spotlight} w={1280} h={720} scale={0.44} />
            <figcaption className="text-sm text-muted">
              <b className="text-foreground">Supplier spotlight.</b>{" "}Each producer&apos;s SKUs with period trends,
              category rank, competitors, channel mix and progress against objectives.
            </figcaption>
          </figure>
          <figure className="flex flex-col gap-3">
            <Dash html={table} w={1000} h={560} scale={0.5632} />
            <figcaption className="text-sm text-muted">
              <b className="text-foreground">Ranked tables.</b>{" "}Suppliers, brands, wine countries or segments ranked
              across the whole market, with the supplier you&apos;re reviewing highlighted.
            </figcaption>
          </figure>
        </div>
      </Slide>

      {/* 5 · how we work + CTA */}
      <Slide n={5}>
        <div className="flex items-end justify-between gap-10">
          <div className="flex flex-col gap-4">
            <Eyebrow>How we work</Eyebrow>
            <h2 className="font-display text-[36px] font-medium leading-[1.1] tracking-tight">
              Designed to be simple, built to <Hl>perform</Hl>
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted">
            Independent, specialised in wine agencies, and already fluent in ezFocus. No generic templates.
          </p>
        </div>
        <ol className="mt-7 grid grid-cols-4 gap-4">
          {[
            ["Understand your reporting", "What you build by hand today, and what suppliers ask for."],
            ["Connect & model", "Power BI reads your ezFocus data, shaped around how agencies sell."],
            ["Design for clarity", "Every page understood in seconds, not decoded."],
            ["Adoption by your team", "Walkthroughs and documentation, so the dashboards get used."],
          ].map(([t, d], i) => (
            <li
              key={t}
              className={`flex min-h-[170px] flex-col gap-2 rounded-2xl p-5 ${
                i === 0 ? "bg-accent text-white" : i % 2 ? "bg-cream" : "bg-surface"
              }`}
            >
              <span className={`text-xs ${i === 0 ? "text-white/70" : "text-muted"}`}>0{i + 1}</span>
              <h3 className="mt-auto font-display text-lg font-medium leading-snug tracking-tight">{t}</h3>
              <p className={`text-sm leading-relaxed ${i === 0 ? "text-white/80" : "text-muted"}`}>{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid grid-cols-[1.3fr_1fr] items-center gap-8 rounded-2xl bg-ink p-8 text-white">
          <div>
            <p className="text-xs text-white/60">Free 30-minute call</p>
            <p className="mt-2 font-display text-[30px] font-medium leading-tight tracking-tight">
              What if your data finally became a <span className="text-[#e9a4ae]">decision tool</span>?
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p className="text-white/60">Book a call</p>
            <p className="font-display text-xl">mat@rsdconsulting.ca</p>
            <p className="text-white/60">matromano.com/contact</p>
          </div>
        </div>
      </Slide>
    </div>
  );
}
