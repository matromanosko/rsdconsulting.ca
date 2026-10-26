import Link from "next/link";
import { Mark } from "./ui";
import BookCallButton from "@/app/components/BookCall";
import LangToggle from "@/app/components/LangToggle";
import { PARTNERS } from "@/app/lib/brand";
import { getLang } from "@/app/lib/i18n/server";
import { dict } from "@/app/lib/i18n/dictionaries";

export default async function Header() {
  const t = dict(await getLang());
  const navLinks = [
    { href: "/examples", label: t.nav.examples },
    { href: "/#faq", label: t.nav.faq },
  ];
  return (
    <header>
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-display tracking-tight">
          <Mark className="h-6 w-6 shrink-0" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-sm leading-[1.1] font-medium sm:text-lg sm:leading-[1.1]">{PARTNERS[0]} &amp;</span>
            <span className="text-sm leading-[1.1] font-medium sm:text-lg sm:leading-[1.1]">{PARTNERS[1]}</span>
            <span className="text-xs text-muted">{t.tagline}</span>
          </span>
        </Link>
        <nav
          aria-label={t.nav.main}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-band px-2 py-1.5 text-sm md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1 text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LangToggle />
          <BookCallButton className="shrink-0 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent">
            <span className="sm:hidden">{t.bookCallShort}</span>
            <span className="hidden sm:inline">{t.bookCall}</span>
          </BookCallButton>
        </div>
      </div>
    </header>
  );
}
