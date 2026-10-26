// Report pages and their filters. Types and option lists only, so the
// client can import this without pulling in the dashboard builders.

export type PageId = "command" | "spotlight" | "tables";

export const LISTING_TYPES = ["All", "RA", "SA", "SL"] as const;
export const STATUSES = ["All", "Active", "Inactive"] as const;
export const GROUPINGS = ["suppliers", "brands", "countries", "segments"] as const;

export type TypeFilter = (typeof LISTING_TYPES)[number];
export type StatusFilter = (typeof STATUSES)[number];
export type GroupingFilter = (typeof GROUPINGS)[number];

export type PageFilters = {
  command: { type: TypeFilter; status: StatusFilter };
  spotlight: { supplier: string; type: TypeFilter; status: StatusFilter };
  tables: { grouping: GroupingFilter; highlight: string };
};

export type ReportRequest = { [P in PageId]: { page: P; filters: PageFilters[P] } }[PageId];

// everything the unlocked page starts from
export type ReportBoot = {
  defaults: PageFilters;
  html: Record<PageId, string>;
  suppliers: string[]; // ours, by sales
  marketSuppliers: string[]; // every supplier, A-Z
};
