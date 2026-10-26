// Shared by the free sample Server Action, the page and the form.

// Set once a visitor requests a sample; holds their first name for the report avatar.
export const ACCESS_COOKIE = "mr_examples";

export const DATA_SOURCES = ["ezFocus", "CRM tools", "Accounting software", "Other"] as const;

export type GateState = { error?: string; sent?: boolean };
