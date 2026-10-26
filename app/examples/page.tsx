import type { Metadata } from "next";
import { cookies } from "next/headers";
import PbiWorkspace from "@/app/components/examples/PbiWorkspace";
import { bootReport } from "@/app/lib/dashboards/render";
import { getLang } from "@/app/lib/i18n/server";
import { dict } from "@/app/lib/i18n/dictionaries";
import { ACCESS_COOKIE } from "./gate";

// The live examples, framed like a report open in the Power BI service.
// Open to everyone; the top bar's Free sample button collects leads.

export async function generateMetadata(): Promise<Metadata> {
  const t = dict(await getLang()).meta;
  return { title: t.examplesTitle, description: t.examplesDescription };
}

export default async function ExamplesPage() {
  const viewer = (await cookies()).get(ACCESS_COOKIE)?.value;
  const lang = await getLang();
  // keyed by language so a switch starts over with that language's renders
  return <PbiWorkspace key={lang} viewer={viewer ?? null} boot={bootReport(lang)} />;
}
