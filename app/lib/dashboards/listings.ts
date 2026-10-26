// SAQ listing types: full names, and short ones for chips and tight labels.
// Kept apart from data.ts so client code can use the labels on their own.

export type ListingType = "RA" | "SA" | "SL";

export const LISTING_LABELS: Record<ListingType, string> = {
  RA: "Regular listing",
  SA: "Specialty listing",
  SL: "Batch-order specialty listing",
};

export const LISTING_SHORT: Record<ListingType, string> = { RA: "Regular", SA: "Specialty", SL: "Batch-order" };
