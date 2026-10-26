import Link from "next/link";
import ReportSkeleton from "./ReportSkeleton";
import { Mark } from "@/app/components/ui";
import type { Dictionary } from "@/app/lib/i18n/dictionaries";

// Home page teaser for /examples: a small Power BI window with the report
// blurred out and a way in.

export default function PbiPreview({ t }: { t: Dictionary["pbi"] }) {
  const pages = Object.values(t.pages);
  return (
    <Link
      href="/examples"
      className="group block overflow-hidden rounded-xl border border-border bg-[#EAEAEA] shadow-[0_8px_30px_rgba(22,21,20,0.08)]"
    >
      <div className="flex h-9 items-center gap-2 bg-[#252423] px-3 text-xs text-white">
        <Mark className="h-4 w-4 text-white" />
        <span className="font-semibold">{t.home}</span>
        <span className="text-white/50">/</span>
        <span className="truncate text-white/80">{t.demo}</span>
        <span className="ml-auto h-5 w-5 rounded-full bg-[#F2C811]" />
      </div>
      <div className="relative p-3 sm:p-6">
        <div className="aspect-video overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.12)] blur-[3px]">
          <ReportSkeleton />
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="flex max-w-sm flex-col items-center gap-3 rounded-lg bg-white/95 px-6 py-5 text-center shadow-lg">
            <p className="font-display text-lg font-semibold tracking-tight">{t.previewTitle}</p>
            <span className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors group-hover:bg-accent">
              {t.previewCta}
            </span>
          </div>
        </div>
      </div>
      <div className="flex overflow-hidden border-t border-[#E1DFDD] bg-white text-xs">
        {pages.map((p, i) => (
          <span
            key={p}
            className={`shrink-0 whitespace-nowrap border-t-[3px] px-4 py-2 ${i ? "border-transparent text-[#605E5C]" : "border-[#F2C811] font-semibold"}`}
          >
            {p}
          </span>
        ))}
      </div>
    </Link>
  );
}
