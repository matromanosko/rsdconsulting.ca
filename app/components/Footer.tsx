import Link from "next/link";
import { Mark } from "./ui";
import BookCallButton from "@/app/components/BookCall";
import { BRAND, PARTNERS, TAGLINE } from "@/app/lib/brand";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-8">
      <div className="relative overflow-hidden rounded-2xl bg-ink px-6 pb-6 pt-10 text-white sm:px-12 sm:pb-8 sm:pt-14">
        <div className="relative z-10 flex flex-col gap-8">
          <Link href="/" className="flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
            <Mark className="h-8 w-8 shrink-0 text-white" />
            <span className="flex flex-col leading-tight">
              <span className="leading-[1.05]">{PARTNERS[0]} &amp;</span>
              <span className="leading-[1.05]">{PARTNERS[1]}</span>
              <span className="mt-1 text-base text-white/60">{TAGLINE}</span>
            </span>
          </Link>
          <dl className="grid gap-6 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-white/60">Focus</dt>
              <dd className="mt-1">Power BI for wine agencies on ezFocus</dd>
            </div>
            <div>
              <dt className="text-xs text-white/60">Email</dt>
              <dd className="mt-1">
                <a href="mailto:mathis.skobinsky@gmail.com" className="hover:underline">
                  mathis.skobinsky@gmail.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/60">Phone</dt>
              <dd className="mt-1">
                <a href="tel:+14384930238" className="hover:underline">
                  (438)-493-0238
                </a>
              </dd>
            </div>
          </dl>
          <div>
            <BookCallButton className="inline-block rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white transition-opacity hover:opacity-90">
              Book a free call
            </BookCallButton>
          </div>
          <p className="text-xs text-white/50">
            © {year} {BRAND}. Independent consultancy, not affiliated with ezFocus or Microsoft.
          </p>
        </div>
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -right-6 hidden h-72 w-72 opacity-90 sm:block"
        >
          <rect x="3" y="13" width="4.5" height="8" rx="1" fill="#ffffff" fillOpacity="0.08" />
          <rect x="9.75" y="8" width="4.5" height="13" rx="1" fill="#ffffff" fillOpacity="0.12" />
          <rect x="16.5" y="3" width="4.5" height="18" rx="1" fill="var(--accent)" />
        </svg>
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm font-bold text-accent">
        <svg viewBox="3 0 18 18" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden>
          <path d="M12 2l1.6 3.2 1.9-.9-.6 4.3 2.6-2.4.6 1.4 2.4-.4-.9 2.7 1.4.7-4.6 3.8.5 1.6-4.4-.6h-1l-4.4.6.5-1.6L3 10.6l1.4-.7-.9-2.7 2.4.4.6-1.4 2.6 2.4-.6-4.3 1.9.9z" />
        </svg>
        <span>Proudly Canadian, based in MTL</span>
      </p>
    </footer>
  );
}
