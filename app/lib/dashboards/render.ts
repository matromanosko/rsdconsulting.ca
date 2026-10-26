import { buildCommandCenter } from "./commandCenter";
import { buildSupplierSpotlight } from "./supplierSpotlight";
import { HIGHLIGHT_SUPPLIER, buildTable } from "./tables";
import { featuredSupplier, getRows, ourSuppliers } from "./data";
import {
  GROUPINGS,
  LISTING_TYPES,
  STATUSES,
  type PageFilters,
  type ReportBoot,
  type ReportRequest,
} from "@/app/examples/report";

// Server-side entry point for the /examples report pages.

export function marketSuppliers() {
  return [...new Set(getRows().map((r) => r.supplier))].sort((a, b) => a.localeCompare(b));
}

export function renderReport(req: ReportRequest): string {
  if (req.page === "command") return buildCommandCenter(req.filters);
  if (req.page === "spotlight") return buildSupplierSpotlight(req.filters.supplier, req.filters);
  return buildTable(req.filters.grouping, req.filters.highlight);
}

// request bodies come from the browser: only accept known pages and values
export function isValidRequest(req: unknown): req is ReportRequest {
  if (!req || typeof req !== "object") return false;
  const { page, filters: f } = req as { page?: unknown; filters?: Record<string, unknown> };
  if (!f || typeof f !== "object") return false;
  const one = (list: readonly string[], v: unknown) => typeof v === "string" && list.includes(v);
  if (page === "command") return one(LISTING_TYPES, f.type) && one(STATUSES, f.status);
  if (page === "spotlight") return one(ourSuppliers(), f.supplier) && one(LISTING_TYPES, f.type) && one(STATUSES, f.status);
  if (page === "tables") return one(GROUPINGS, f.grouping) && one(marketSuppliers(), f.highlight);
  return false;
}

export function bootReport(): ReportBoot {
  const defaults: PageFilters = {
    command: { type: "All", status: "All" },
    spotlight: { supplier: featuredSupplier(), type: "All", status: "All" },
    tables: { grouping: "suppliers", highlight: HIGHLIGHT_SUPPLIER },
  };
  return {
    defaults,
    html: {
      command: renderReport({ page: "command", filters: defaults.command }),
      spotlight: renderReport({ page: "spotlight", filters: defaults.spotlight }),
      tables: renderReport({ page: "tables", filters: defaults.tables }),
    },
    suppliers: ourSuppliers(),
    marketSuppliers: marketSuppliers(),
  };
}
