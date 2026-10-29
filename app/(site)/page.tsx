import PbiPreview from "@/app/components/examples/PbiPreview";
import FreeSampleButton from "@/app/components/examples/FreeSample";
import HeroCards from "@/app/components/HeroCards";
import { Eyebrow, Hl, PillLink, pillClass } from "@/app/components/ui";
import BookCallButton from "@/app/components/BookCall";
import { getLang } from "@/app/lib/i18n/server";
import { dict } from "@/app/lib/i18n/dictionaries";

const wrap = "mx-auto w-full max-w-7xl px-4 sm:px-8";
const h2 = "font-display text-3xl font-medium leading-tight tracking-tight sm:text-5xl";

// [before, accent, after] -> text with the accented word
function Accented({ parts: [before, hl, after = ""] }: { parts: readonly [string, string, string?] }) {
  return (
    <>
      {before}
      <Hl>{hl}</Hl>
      {after}
    </>
  );
}

export default async function Home() {
  const lang = await getLang();
  const d = dict(lang);
  const t = d.home;
  const [exLine1, exBefore, exHl, exAfter] = t.examplesTitle;
  return (
    <>
      {/* ---------- hero ---------- */}
      <section className={`${wrap} grid items-center gap-14 pb-10 pt-4 lg:grid-cols-2 lg:pb-12 lg:pt-6`}>
        <div className="flex flex-col gap-6">
          <Eyebrow>{t.heroEyebrow}</Eyebrow>
          <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
            {t.heroTitle}
          </h1>
          <p className="font-display text-2xl font-medium leading-tight tracking-tight sm:text-3xl">
            <Accented parts={t.heroSubtitle} />
          </p>
          <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t.heroBody}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <BookCallButton className={pillClass()}>{d.bookFreeCall}</BookCallButton>
            <PillLink href="/examples" variant="light">
              {t.seeExamples}
            </PillLink>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <HeroCards lang={lang} />
          <p className="text-right text-xs font-medium">
            <Accented parts={t.integrated} />
          </p>
        </div>
      </section>

      {/* ---------- examples ---------- */}
      <section id="examples" className={`${wrap} scroll-mt-8 pb-10 pt-10 lg:pb-12 lg:pt-12`}>
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
          <Eyebrow>{t.examplesEyebrow}</Eyebrow>
          <h2 className={h2}>
            {exLine1}{" "}
            <span className="block">
              <Accented parts={[exBefore, exHl, exAfter]} />
            </span>
          </h2>
          <p className="max-w-2xl text-muted">
            {t.examplesBody[0]}{" "}
            <span className="block">{t.examplesBody[1]}</span>
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-6xl">
          <PbiPreview t={d.pbi} />
        </div>
        <div className="mt-8 flex justify-center">
          <FreeSampleButton className={pillClass()}>
            {t.freeSample}
          </FreeSampleButton>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className={`${wrap} scroll-mt-8 flex flex-col gap-8 pb-20 pt-10 lg:pb-28 lg:pt-12`}>
        <div className="flex flex-col gap-5">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className={h2}>
            <Accented parts={t.faqTitle} />
          </h2>
        </div>
        <div className="flex flex-col">
          {t.faqs.map((f) => (
            <details key={f.question} className="group border-b border-border py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {f.question}
                <span className="text-xl leading-none text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- closing CTA ---------- */}
      <section className={`${wrap} pb-16 lg:pb-20`}>
        <div className="grid items-center gap-6 rounded-2xl bg-cream p-6 sm:p-10 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col items-start gap-5">
            <Eyebrow>{t.ctaEyebrow}</Eyebrow>
            <h2 className={h2}>
              <Accented parts={t.ctaTitle} />
            </h2>
            <BookCallButton className={pillClass()}>{d.bookFreeCall}</BookCallButton>
          </div>
          <p className="text-muted lg:text-lg">
            {t.ctaBody}
          </p>
        </div>
      </section>
    </>
  );
}
