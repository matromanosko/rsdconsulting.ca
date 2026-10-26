import PbiPreview from "@/app/components/examples/PbiPreview";
import FreeSampleButton from "@/app/components/examples/FreeSample";
import HeroCards from "@/app/components/HeroCards";
import { Eyebrow, Hl, PillLink, pillClass } from "@/app/components/ui";
import BookCallButton from "@/app/components/BookCall";

const faqs = [
  {
    question: "Why do I need Power BI on top of ezFocus?",
    answer:
      "Power BI handles data much better than ezFocus, and lets us present it however you want. Having both together eliminates the need for you to format data manually.",
  },
  {
    question: "How do you integrate with ezFocus?",
    answer: "We use the ezFocus API to pull data in real time.",
  },
  {
    question: "Do we need Power BI licenses?",
    answer: "Yes. They cost about $14 per member.",
  },
  {
    question: "How long does a project take?",
    answer: "Usually around 1 to 2 months, depending on how many data sources and reports you need.",
  },
  {
    question: "Can our suppliers see their own reports?",
    answer: "Yes. You can give your suppliers view access, if you want to.",
  },
];

const wrap = "mx-auto w-full max-w-6xl px-4 sm:px-8";
const h2 = "font-display text-3xl font-medium leading-tight tracking-tight sm:text-5xl";

export default function Home() {
  return (
    <>
      {/* ---------- hero ---------- */}
      <section className={`${wrap} grid items-center gap-14 pb-10 pt-4 lg:grid-cols-2 lg:pb-12 lg:pt-6`}>
        <div className="flex flex-col gap-6">
          <Eyebrow>ezFocus-to-Power BI specialists</Eyebrow>
          <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
            Automate data handling, focus on <Hl>decisions</Hl>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted sm:text-lg">
            We&apos;re Power BI engineers specialised in helping Canadian wine &amp; spirit agencies save time on
            data work.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <BookCallButton className={pillClass()}>Book a free call</BookCallButton>
            <PillLink href="/examples" variant="light">
              See live examples
            </PillLink>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <HeroCards />
          <p className="text-right text-xs font-medium">
            <Hl>Seamlessly integrated</Hl> with ezFocus data
          </p>
        </div>
      </section>

      {/* ---------- examples ---------- */}
      <section id="examples" className={`${wrap} scroll-mt-8 pb-10 pt-10 lg:pb-12 lg:pt-12`}>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <Eyebrow>Live examples</Eyebrow>
          <h2 className={h2}>
            Track your sales data{" "}
            <span className="block">
              exactly how you <Hl>dreamt it</Hl>.
            </span>
          </h2>
          <p className="max-w-xl text-muted">
            Check out three example templates below to see what we can do.{" "}
            <span className="block">
              We can start from there, or build custom visuals exactly how you want them.
            </span>
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-4xl">
          <PbiPreview />
        </div>
        <div className="mt-8 flex justify-center">
          <FreeSampleButton className={pillClass()}>
            Get a free sample
          </FreeSampleButton>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className={`${wrap} scroll-mt-8 flex flex-col gap-8 pb-20 pt-10 lg:pb-28 lg:pt-12`}>
        <div className="flex flex-col gap-5">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className={h2}>
            Common <Hl>questions</Hl>
          </h2>
        </div>
        <div className="flex max-w-3xl flex-col">
          {faqs.map((f) => (
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
            <Eyebrow>Free 30-minute call</Eyebrow>
            <h2 className={h2}>
              Let&apos;s get your data <Hl>sorted</Hl>.
            </h2>
            <BookCallButton className={pillClass()}>Book a free call</BookCallButton>
          </div>
          <p className="text-muted lg:text-lg">
            Book a 30-minute intro call to see what we can do. Send us info on your data sources and KPIs to save
            time on the call, so we can draw up mockups beforehand.
          </p>
        </div>
      </section>
    </>
  );
}
