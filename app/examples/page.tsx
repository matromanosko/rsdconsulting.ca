import type { Metadata } from "next";
import { cookies } from "next/headers";
import PbiWorkspace from "@/app/components/examples/PbiWorkspace";
import { bootReport } from "@/app/lib/dashboards/render";
import { ACCESS_COOKIE } from "./gate";

// The live examples, framed like a report open in the Power BI service.
// Open to everyone; the top bar's Free sample button collects leads.

export const metadata: Metadata = {
  title: "Live examples — Power BI for wine agencies",
  description: "Explore live Power BI reports built on mock ezFocus data: agency KPI dashboard, supplier dashboard and ranked tables.",
};

export default async function ExamplesPage() {
  const viewer = (await cookies()).get(ACCESS_COOKIE)?.value;
  return <PbiWorkspace viewer={viewer ?? null} boot={bootReport()} />;
}
