"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { FreeSampleDialog } from "./FreeSample";
import ReportSkeleton from "./ReportSkeleton";
import { Mark } from "@/app/components/ui";
import BookCallButton from "@/app/components/BookCall";
import { LISTING_LABELS } from "@/app/lib/dashboards/listings";
import { renderReportPage } from "@/app/examples/actions";
import {
  GROUPINGS,
  LISTING_TYPES,
  STATUSES,
  type PageFilters,
  type PageId,
  type ReportBoot,
  type ReportRequest,
} from "@/app/examples/report";

// The examples page dressed as a report open in the Power BI service: top
// bar, pages pane, canvas fit to the page and a filters pane. Changing a
// filter re-renders that page on the server.

const PAGES: { id: PageId; label: string }[] = [
  { id: "command", label: "Agency KPI Dashboard" },
  { id: "spotlight", label: "Supplier Dashboard" },
  { id: "tables", label: "Ranked tables" },
];

// design size of each page, as set in the report
const SIZES: Record<PageId, { width: number; height: number; maxScale: number }> = {
  command: { width: 1280, height: 720, maxScale: 1.25 },
  spotlight: { width: 1280, height: 720, maxScale: 1.25 },
  tables: { width: 900, height: 500, maxScale: 1.4 },
};

const GROUPING_LABELS: Record<(typeof GROUPINGS)[number], string> = {
  suppliers: "Suppliers",
  brands: "Brands",
  countries: "Wine countries",
  segments: "Segments",
};

// what the filters pane shows behind the gate
const LOCKED_FILTERS: PageFilters = {
  command: { type: "All", status: "All" },
  spotlight: { supplier: "", type: "All", status: "All" },
  tables: { grouping: "suppliers", highlight: "" },
};

type Option = { value: string; label: string };
type FilterDef = { key: string; label: string; kind: "list" | "select"; options: Option[] };

const plain = (values: readonly string[]): Option[] => values.map((v) => ({ value: v, label: v }));

function filterDefs(page: PageId, boot: ReportBoot | null): FilterDef[] {
  const listing: FilterDef = {
    key: "type",
    label: "Listing type",
    kind: "list",
    options: LISTING_TYPES.map((t) => ({ value: t, label: t === "All" ? "All" : LISTING_LABELS[t] })),
  };
  const status: FilterDef = { key: "status", label: "Status", kind: "list", options: plain(STATUSES) };
  if (page === "command") return [listing, status];
  if (page === "spotlight")
    return [{ key: "supplier", label: "Supplier", kind: "select", options: plain(boot?.suppliers ?? []) }, listing, status];
  return [
    {
      key: "grouping",
      label: "Group by",
      kind: "list",
      options: GROUPINGS.map((g) => ({ value: g, label: GROUPING_LABELS[g] })),
    },
    { key: "highlight", label: "Highlight supplier", kind: "select", options: plain(boot?.marketSuppliers ?? []) },
  ];
}

const keyOf = (req: ReportRequest) => JSON.stringify(req);

const FONT = '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif';

// "This scrolls" hint, run inside the report frame when the frame is named
// "intro" (first open of the agency and supplier pages): each scroll area
// eases down a little, pauses, and eases back up. Any touch, wheel or key
// stops it and returns the lists to the top.
const INTRO_JS = `(() => {
  if (window.name !== "intro" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const DELAY = 500, DOWN = 1170, HOLD = 0, UP = 1170;
  const scrolls = [...document.querySelectorAll(".scroll")].filter((el) => el.scrollHeight > el.clientHeight + 8);
  if (!scrolls.length) return;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let raf = 0, done = false;
  const stop = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    scrolls.forEach((el) => (el.scrollTop = 0));
  };
  ["pointerdown", "wheel", "keydown", "touchstart"].forEach((t) => addEventListener(t, stop, { once: true, capture: true }));
  const t0 = performance.now() + DELAY;
  const tick = (now) => {
    if (done) return;
    const t = now - t0;
    let k = 0;
    if (t > 0 && t < DOWN) k = ease(t / DOWN);
    else if (t >= DOWN && t < DOWN + HOLD) k = 1;
    else if (t >= DOWN + HOLD) k = 1 - ease(Math.min((t - DOWN - HOLD) / UP, 1));
    scrolls.forEach((el) => (el.scrollTop = Math.min(120, el.scrollHeight - el.clientHeight) * k));
    if (t < DOWN + HOLD + UP) raf = requestAnimationFrame(tick);
    else stop();
  };
  raf = requestAnimationFrame(tick);
})();`;

const INTRO_PAGES: PageId[] = ["command", "spotlight"];

function srcDoc(html: string) {
  return (
    "<!doctype html><html><head><meta charset='utf-8'>" +
    "<style>html,body{margin:0;padding:0;background:#F6F3EE;}</style>" +
    `</head><body>${html}<script>${INTRO_JS}</script></body></html>`
  );
}

/* ---------- icons ---------- */

function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  chevronRight: "M9 6l6 6-6 6",
  collapseLeft: "M11 17l-5-5 5-5M18 17l-5-5 5-5",
  collapseRight: "M13 17l5-5-5-5M6 17l5-5-5-5",
  filter: "M3 5h18l-7 8v6l-4 2v-8z",
  pages: "M7 3h7l5 5v13H7zM14 3v5h5",
  eraser: "M8 20h12M5.5 14.5l8-8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 18H8.5z",
  close: "M6 6l12 12M18 6L6 18",
};

/* ---------- canvas ---------- */

// Fits a page of fixed design size into the space left, like "Fit to page".
// On narrow screens it fits the width and lets the page scroll vertically.
function Canvas({ width, height, maxScale, children }: { width: number; height: number; maxScale: number; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      const fitW = (w - 32) / width;
      const s = Math.min(maxScale, w < 768 ? fitW : Math.min(fitW, (h - 32) / height));
      setScale(Math.max(0.2, s));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, maxScale]);

  return (
    <div ref={boxRef} className="absolute inset-0 overflow-auto">
      <div className="flex min-h-full items-start justify-center p-4 md:items-center">
        <div
          className="shrink-0 overflow-hidden bg-[#F6F3EE] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
          style={{ width: width * scale, height: height * scale, visibility: scale ? "visible" : "hidden" }}
        >
          <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "0 0" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- filters ---------- */

function FilterCard({
  def,
  value,
  isDefault,
  disabled,
  onChange,
  onClear,
}: {
  def: FilterDef;
  value: string;
  isDefault: boolean;
  disabled: boolean;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  const current = def.options.find((o) => o.value === value)?.label ?? (value || "—");
  return (
    <fieldset className="rounded-[2px] border border-[#E1DFDD] bg-white" disabled={disabled}>
      <div className="flex items-start gap-2 px-3 pt-2">
        <div className="min-w-0 flex-1">
          <legend className="text-xs font-semibold">{def.label}</legend>
          <p className="truncate text-xs text-[#605E5C]">is {current}</p>
        </div>
        {!isDefault && (
          <button
            type="button"
            onClick={onClear}
            title="Clear filter"
            aria-label={`Clear ${def.label} filter`}
            className="-mr-1 flex h-6 w-6 items-center justify-center rounded-[2px] text-[#605E5C] hover:bg-[#F3F2F1] hover:text-[#252423]"
          >
            <Icon d={ICONS.eraser} className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="px-3 pb-3 pt-2">
        {def.kind === "select" ? (
          <select
            aria-label={def.label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-full rounded-[2px] border border-[#8A8886] bg-white px-1.5 text-xs outline-none focus:border-[#252423] disabled:opacity-50"
          >
            {def.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex flex-col gap-1">
            {def.options.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="radio"
                  name={def.key}
                  value={o.value}
                  checked={o.value === value}
                  onChange={() => onChange(o.value)}
                  className="h-3.5 w-3.5 accent-[#252423]"
                />
                {o.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </fieldset>
  );
}

/* ---------- workspace ---------- */

export default function PbiWorkspace({ viewer, boot }: { viewer: string | null; boot: ReportBoot | null }) {
  const locked = !boot;
  const [page, setPage] = useState<PageId>("command");
  const [filters, setFilters] = useState<PageFilters>(boot?.defaults ?? LOCKED_FILTERS);
  const [pagesOpen, setPagesOpen] = useState(true);
  const [sampleOpen, setSampleOpen] = useState(false);
  // pages whose intro animation has already played this visit
  const [introSeen, setIntroSeen] = useState<PageId[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(true); // docked pane, lg and up
  const [filtersSheet, setFiltersSheet] = useState(false); // overlay, below lg

  // rendered pages by request; seeded with the defaults the server sent
  const [cache, setCache] = useState(() => {
    const m = new Map<string, string>();
    if (boot) for (const p of PAGES) m.set(keyOf({ page: p.id, filters: boot.defaults[p.id] } as ReportRequest), boot.html[p.id]);
    return m;
  });
  // last page rendered for each tab, shown while a new one loads
  const [shown, setShown] = useState<Record<PageId, string> | null>(boot?.html ?? null);

  const request = { page, filters: filters[page] } as ReportRequest;
  const key = keyOf(request);
  const html = cache.get(key) ?? shown?.[page] ?? null;
  const loading = !locked && !cache.has(key);

  useEffect(() => {
    if (locked || cache.has(key)) return;
    let live = true;
    renderReportPage(JSON.parse(key)).then((next) => {
      // null means the server rejected the request; keep the last render
      if (next === null) return;
      setCache((m) => new Map(m).set(key, next));
      if (live) setShown((s) => s && { ...s, [JSON.parse(key).page as PageId]: next });
    });
    return () => {
      live = false;
    };
  }, [key, locked, cache]);

  const current = PAGES.find((p) => p.id === page)!;
  const size = SIZES[page];
  const defs = filterDefs(page, boot);
  const values = filters[page] as Record<string, string>;
  const defaults = (boot?.defaults ?? LOCKED_FILTERS)[page] as Record<string, string>;

  const setFilter = (k: string, v: string) => setFilters((f) => ({ ...f, [page]: { ...f[page], [k]: v } }));
  const changed = defs.filter((d) => values[d.key] !== defaults[d.key]).length;

  const pageButton = (p: (typeof PAGES)[number], compact = false) => (
    <button
      key={p.id}
      type="button"
      role="tab"
      aria-selected={p.id === page}
      onClick={() => setPage(p.id)}
      className={
        compact
          ? `shrink-0 whitespace-nowrap border-b-[3px] px-3 py-2 text-xs ${
              p.id === page ? "border-[#F2C811] font-semibold" : "border-transparent text-[#605E5C]"
            }`
          : `w-full border-l-[3px] px-3 py-2 text-left text-sm ${
              p.id === page ? "border-[#F2C811] bg-[#F3F2F1] font-semibold" : "border-transparent text-[#323130] hover:bg-[#FAF9F8]"
            }`
      }
    >
      {p.label}
    </button>
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#EAEAEA] text-[#252423]" style={{ fontFamily: FONT }}>
      {/* top bar */}
      <header className="flex h-12 shrink-0 items-center gap-3 bg-[#252423] px-3 text-white">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <Mark className="h-5 w-5 shrink-0 text-white" />
          Home
        </Link>
        <span className="hidden h-5 w-px bg-white/25 sm:block" />
        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 truncate text-sm text-white/80 sm:flex">
          <span>Demo</span>
          <Icon d={ICONS.chevronRight} className="h-3 w-3 shrink-0" />
          <span className="truncate text-white">{current.label}</span>
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setFiltersSheet(true)}
            className="flex h-8 items-center gap-1.5 rounded-[2px] px-2 text-white/85 hover:bg-white/10 lg:hidden"
          >
            <Icon d={ICONS.filter} />
            Filters{changed ? ` (${changed})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setSampleOpen(true)}
            className="flex h-8 items-center rounded-[2px] bg-[#F2C811] px-3 font-semibold text-[#252423] hover:bg-[#F2C811]/90"
          >
            Free sample
          </button>
          <BookCallButton className="flex h-8 items-center rounded-[2px] bg-white px-3 font-semibold text-[#252423] hover:bg-white/90">
            Book a call
          </BookCallButton>
          <span
            title={viewer ?? "Guest"}
            className="ml-1 hidden h-7 w-7 items-center justify-center rounded-full bg-[#F2C811] text-xs font-semibold text-[#252423] sm:flex"
          >
            {viewer ? viewer.charAt(0).toUpperCase() : "?"}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* pages pane */}
        <aside
          aria-label="Pages"
          className={`hidden shrink-0 flex-col border-r border-[#E1DFDD] bg-white md:flex ${pagesOpen ? "w-56" : "w-9 items-center"}`}
        >
          <button
            type="button"
            onClick={() => setPagesOpen((o) => !o)}
            aria-expanded={pagesOpen}
            title={pagesOpen ? "Collapse pages" : "Expand pages"}
            className={`flex items-center gap-2 py-2.5 text-sm font-semibold hover:bg-[#FAF9F8] ${pagesOpen ? "w-full px-3" : "flex-col px-1"}`}
          >
            <Icon d={ICONS.pages} />
            {pagesOpen ? (
              <>
                Pages
                <Icon d={ICONS.collapseLeft} className="ml-auto h-3.5 w-3.5 text-[#605E5C]" />
              </>
            ) : (
              <span className="[writing-mode:vertical-rl]">Pages</span>
            )}
          </button>
          {pagesOpen && (
            <div role="tablist" aria-label="Report pages" aria-orientation="vertical" className="flex flex-col pt-1">
              {PAGES.map((p) => pageButton(p))}
            </div>
          )}
        </aside>

        {/* report */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div role="tablist" aria-label="Report pages" className="flex shrink-0 overflow-x-auto border-b border-[#E1DFDD] bg-white md:hidden">
            {PAGES.map((p) => pageButton(p, true))}
          </div>
          <div className="relative min-h-0 flex-1 bg-[#EAEAEA]">
            {loading && <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-[#F2C811]" />}
            <Canvas {...size}>
              {html ? (
                <iframe
                  title={`${current.label} (mock data)`}
                  srcDoc={srcDoc(html)}
                  // renaming doesn't reload the frame, so the intro only runs on a page's first load
                  name={INTRO_PAGES.includes(page) && !introSeen.includes(page) ? "intro" : ""}
                  onLoad={() => setIntroSeen((s) => (s.includes(page) ? s : [...s, page]))}
                  // scripts for the intro only; no same-origin access to the site
                  sandbox="allow-scripts"
                  style={{
                    width: size.width,
                    height: size.height,
                    border: 0,
                    display: "block",
                    opacity: loading ? 0.55 : 1,
                    transition: "opacity 150ms",
                  }}
                />
              ) : (
                <div className="h-full w-full blur-[6px]">
                  <ReportSkeleton />
                </div>
              )}
            </Canvas>
          </div>
        </div>

        {/* filters pane: docked from lg, a sheet below */}
        {filtersSheet && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setFiltersSheet(false)} />}
        <aside
          aria-label="Filters"
          className={`shrink-0 flex-col border-l border-[#E1DFDD] bg-[#FAF9F8] ${
            filtersSheet ? "fixed inset-y-0 right-0 z-30 flex w-72 shadow-xl" : "hidden"
          } lg:static lg:z-auto lg:flex lg:shadow-none ${filtersOpen ? "lg:w-64" : "lg:w-9 lg:items-center"}`}
        >
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              title={filtersOpen ? "Collapse filters" : "Expand filters"}
              className={`hidden items-center gap-2 py-2.5 text-sm font-semibold hover:bg-[#F3F2F1] lg:flex ${
                filtersOpen ? "w-full px-3" : "flex-col px-1"
              }`}
            >
              <Icon d={ICONS.filter} />
              {filtersOpen ? (
                <>
                  Filters
                  <Icon d={ICONS.collapseRight} className="ml-auto h-3.5 w-3.5 text-[#605E5C]" />
                </>
              ) : (
                <span className="[writing-mode:vertical-rl]">Filters</span>
              )}
            </button>
            <div className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold lg:hidden">
              <Icon d={ICONS.filter} />
              Filters
              <button
                type="button"
                onClick={() => setFiltersSheet(false)}
                aria-label="Close filters"
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-[2px] hover:bg-[#F3F2F1]"
              >
                <Icon d={ICONS.close} />
              </button>
            </div>
          </div>

          <div className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-4 ${filtersOpen ? "" : "lg:hidden"}`}>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs font-semibold text-[#605E5C]">Filters on this page</p>
              {changed > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, [page]: (boot?.defaults ?? LOCKED_FILTERS)[page] }))}
                  className="text-xs font-semibold text-[#252423] underline-offset-2 hover:underline"
                >
                  Reset all
                </button>
              )}
            </div>
            {defs.map((d) => (
              <FilterCard
                key={`${page}-${d.key}`}
                def={d}
                value={values[d.key]}
                isDefault={values[d.key] === defaults[d.key]}
                disabled={locked}
                onChange={(v) => setFilter(d.key, v)}
                onClear={() => setFilter(d.key, defaults[d.key])}
              />
            ))}
            <p className="pt-2 text-xs text-[#605E5C]">All figures are mock ezFocus data.</p>
          </div>
        </aside>
      </div>

      {sampleOpen && <FreeSampleDialog onClose={() => setSampleOpen(false)} />}
    </div>
  );
}
