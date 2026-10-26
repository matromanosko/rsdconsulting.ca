"use server";

import { cookies } from "next/headers";
import { ACCESS_COOKIE, DATA_SOURCES, type GateState } from "./gate";
import type { ReportRequest } from "./report";
import { isValidRequest, renderReport } from "@/app/lib/dashboards/render";
import { getLang } from "@/app/lib/i18n/server";
import { dict } from "@/app/lib/i18n/dictionaries";

// Free sample requests from the home page and /examples. A valid lead is
// POSTed as JSON to LEADS_WEBHOOK_URL (Zapier, Make, Formspree, Slack…) when
// that is set, and ACCESS_COOKIE remembers the visitor's first name.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestSample(_prev: GateState, formData: FormData): Promise<GateState> {
  const field = (k: string) => String(formData.get(k) ?? "").trim();
  const lead = {
    name: field("name"),
    email: field("email"),
    phone: field("phone"),
    company: field("company"),
    sources: formData.getAll("sources").map(String).filter((s) => (DATA_SOURCES as readonly string[]).includes(s)),
    otherSource: field("otherSource"),
    submittedAt: new Date().toISOString(),
  };

  const errors = dict(await getLang()).sample.errors;
  if (!lead.name || !lead.company) return { error: errors.nameCompany };
  if (!EMAIL.test(lead.email)) return { error: errors.email };
  if (lead.phone.replace(/\D/g, "").length < 7) return { error: errors.phone };
  if (!lead.sources.length) return { error: errors.sources };

  const webhook = process.env.LEADS_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!res.ok) console.error(`[free sample] webhook responded ${res.status}`, JSON.stringify(lead));
    } catch (err) {
      // keep the lead in the logs if delivery fails
      console.error("[free sample] webhook failed", err, JSON.stringify(lead));
    }
  } else {
    console.log("[free sample] new lead (set LEADS_WEBHOOK_URL to forward it)", JSON.stringify(lead));
  }

  (await cookies()).set(ACCESS_COOKIE, lead.name.split(/\s+/)[0], {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return { sent: true };
}

// Re-renders one report page with new filter values.
export async function renderReportPage(req: ReportRequest): Promise<string | null> {
  if (!isValidRequest(req)) return null;
  return renderReport(req, await getLang());
}
