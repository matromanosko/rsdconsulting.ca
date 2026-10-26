// Mock ezFocus-style dataset for the dashboard demos.
//
// Mirrors the shape of 'Summary By Products' (one row per SKU) plus the
// '10 Year Data' / '10 Year Data $' history the Power BI measures read from.
// Every supplier, brand, agency and number here is invented. The generator
// is seeded so the demos render the same figures on every load.

import type { ListingType } from "./listings";

export type { ListingType } from "./listings";
export { LISTING_LABELS, LISTING_SHORT } from "./listings";
export type WineColor = "RED" | "WHITE" | "ROSE" | "";

export type Row = {
  code: string;
  desc: string;
  agent: string;
  supplier: string;
  brand: string;
  country: string;
  category: string;
  segment: string;
  color: WineColor;
  type: ListingType;
  status: "Active" | "Inactive";
  ins: string; // [Date Insertion]: ISO date, or "5 years +" for legacy listings
  format: number;
  px: number;
  pxL: number;
  stT: number; // distribution (points of sale) TY
  stL: number;
  // 9L cases: market sales by period, TY and LY
  r1: number; r1L: number;
  r3: number; r3L: number;
  r6: number; r6L: number;
  yt: number; ytL: number;
  ry: number; ryL: number;
  // sales $ rolling year
  d: number; dL: number;
  // channels, 9L cases RY: retail, on premise, restaurant supply, agency stores
  c1: number; c1L: number;
  c2: number; c2L: number;
  c3: number; c3L: number;
  c4: number; c4L: number;
  // calendar-year history 2016..2025
  hist: number[];
  histD: number[];
};

export const OUR_AGENT = "Your Agency";

// the listing type / status slicers; "All" leaves the field unfiltered
export type RowFilter = { type: ListingType | "All"; status: Row["status"] | "All" };
export const NO_FILTER: RowFilter = { type: "All", status: "All" };

export function matches(f: RowFilter) {
  return (r: Row) => (f.type === "All" || r.type === f.type) && (f.status === "All" || r.status === f.status);
}
export const FIRST_YEAR = 2016;
export const MAX_YEAR = 2025;
// fixed "today" so the demo never drifts out of step with its own data
export const DEMO_TODAY = new Date(2026, 9, 15);

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Cat = {
  name: string;
  segment: string;
  country: string;
  color: WineColor;
  price: [number, number];
  styles: string[];
};

const CATS: Cat[] = [
  { name: "Red · France Bordeaux", segment: "Wines", country: "France", color: "RED", price: [16, 48], styles: ["Bordeaux Supérieur", "Médoc", "Côtes de Bourg", "Saint-Émilion"] },
  { name: "Red · France Rhône", segment: "Wines", country: "France", color: "RED", price: [15, 38], styles: ["Côtes du Rhône", "Vacqueyras", "Ventoux", "Crozes-Hermitage"] },
  { name: "White · France Burgundy", segment: "Wines", country: "France", color: "WHITE", price: [19, 52], styles: ["Bourgogne Blanc", "Mâcon-Villages", "Chablis", "Saint-Véran"] },
  { name: "Rosé · France Provence", segment: "Wines", country: "France", color: "ROSE", price: [16, 30], styles: ["Côtes de Provence", "Coteaux d'Aix", "Rosé Prestige"] },
  { name: "Red · Italy", segment: "Wines", country: "Italy", color: "RED", price: [14, 45], styles: ["Chianti Classico", "Montepulciano", "Valpolicella Ripasso", "Primitivo", "Nero d'Avola"] },
  { name: "White · Italy", segment: "Wines", country: "Italy", color: "WHITE", price: [14, 28], styles: ["Pinot Grigio", "Soave Classico", "Vermentino", "Gavi"] },
  { name: "Red · Spain", segment: "Wines", country: "Spain", color: "RED", price: [13, 36], styles: ["Rioja Crianza", "Ribera del Duero", "Garnacha", "Monastrell"] },
  { name: "Red · Portugal", segment: "Wines", country: "Portugal", color: "RED", price: [12, 30], styles: ["Douro Tinto", "Alentejo", "Dão Reserva"] },
  { name: "White · New Zealand", segment: "Wines", country: "New Zealand", color: "WHITE", price: [17, 29], styles: ["Sauvignon Blanc", "Pinot Gris", "Riesling"] },
  { name: "Red · Argentina", segment: "Wines", country: "Argentina", color: "RED", price: [13, 32], styles: ["Malbec", "Malbec Reserva", "Cabernet Franc"] },
  { name: "Red · Chile", segment: "Wines", country: "Chile", color: "RED", price: [12, 26], styles: ["Carménère", "Cabernet Sauvignon", "Merlot"] },
  { name: "Red · United States", segment: "Wines", country: "United States", color: "RED", price: [18, 55], styles: ["Cabernet Sauvignon", "Zinfandel", "Pinot Noir", "Red Blend"] },
  { name: "White · Germany", segment: "Wines", country: "Germany", color: "WHITE", price: [15, 30], styles: ["Riesling Trocken", "Riesling Kabinett", "Grauburgunder"] },
  { name: "Red · Australia", segment: "Wines", country: "Australia", color: "RED", price: [14, 34], styles: ["Shiraz", "Grenache Shiraz", "Cabernet Merlot"] },
  { name: "White · South Africa", segment: "Wines", country: "South Africa", color: "WHITE", price: [12, 24], styles: ["Chenin Blanc", "Sauvignon Blanc"] },
  { name: "Red · Greece", segment: "Wines", country: "Greece", color: "RED", price: [15, 28], styles: ["Xinomavro", "Agiorgitiko"] },
  { name: "White · Austria", segment: "Wines", country: "Austria", color: "WHITE", price: [16, 29], styles: ["Grüner Veltliner", "Gemischter Satz"] },
  { name: "Rosé · Spain", segment: "Wines", country: "Spain", color: "ROSE", price: [12, 20], styles: ["Rosado", "Garnacha Rosé"] },
  { name: "White · Spain", segment: "Wines", country: "Spain", color: "WHITE", price: [12, 24], styles: ["Albariño", "Verdejo", "Rioja Blanco"] },
  { name: "White · Portugal", segment: "Wines", country: "Portugal", color: "WHITE", price: [11, 22], styles: ["Vinho Verde", "Douro Branco"] },
  { name: "Red · New Zealand", segment: "Wines", country: "New Zealand", color: "RED", price: [24, 42], styles: ["Pinot Noir", "Central Otago Pinot Noir"] },
  { name: "White · Chile", segment: "Wines", country: "Chile", color: "WHITE", price: [11, 20], styles: ["Sauvignon Blanc", "Chardonnay"] },
  { name: "White · Argentina", segment: "Wines", country: "Argentina", color: "WHITE", price: [12, 22], styles: ["Torrontés", "Chardonnay"] },
  { name: "White · United States", segment: "Wines", country: "United States", color: "WHITE", price: [18, 40], styles: ["Chardonnay", "Sauvignon Blanc"] },
  { name: "Red · Austria", segment: "Wines", country: "Austria", color: "RED", price: [16, 28], styles: ["Zweigelt", "Blaufränkisch"] },
  { name: "Red · South Africa", segment: "Wines", country: "South Africa", color: "RED", price: [13, 26], styles: ["Pinotage", "Cape Blend"] },
  { name: "Rosé · Italy", segment: "Wines", country: "Italy", color: "ROSE", price: [13, 22], styles: ["Rosato", "Chiaretto"] },
  { name: "Rosé · United States", segment: "Wines", country: "United States", color: "ROSE", price: [15, 25], styles: ["Rosé of Pinot Noir"] },
  { name: "White · Australia", segment: "Wines", country: "Australia", color: "WHITE", price: [14, 26], styles: ["Chardonnay", "Riesling"] },
  { name: "White · Greece", segment: "Wines", country: "Greece", color: "WHITE", price: [16, 30], styles: ["Assyrtiko", "Moschofilero"] },
  { name: "Sparkling · Italy", segment: "Sparkling", country: "Italy", color: "", price: [15, 26], styles: ["Prosecco DOC", "Prosecco Superiore", "Franciacorta"] },
  { name: "Sparkling · Champagne", segment: "Sparkling", country: "France", color: "", price: [48, 95], styles: ["Brut", "Brut Rosé", "Blanc de Blancs"] },
  { name: "Sparkling · Spain", segment: "Sparkling", country: "Spain", color: "", price: [14, 24], styles: ["Cava Brut", "Cava Reserva"] },
  { name: "Scotch Whisky", segment: "Spirits", country: "United Kingdom", color: "", price: [38, 110], styles: ["Single Malt 12 yo", "Blended", "Single Malt 18 yo"] },
  { name: "Gin", segment: "Spirits", country: "United Kingdom", color: "", price: [32, 52], styles: ["London Dry", "Pink Gin", "Navy Strength"] },
  { name: "Rum", segment: "Spirits", country: "Barbados", color: "", price: [28, 70], styles: ["Gold", "Spiced", "8 yo"] },
  { name: "Tequila", segment: "Spirits", country: "Mexico", color: "", price: [40, 85], styles: ["Blanco", "Reposado", "Añejo"] },
  { name: "Cider", segment: "Ciders", country: "Canada", color: "", price: [9, 18], styles: ["Dry Cider", "Rosé Cider", "Ice Cider"] },
  { name: "Imported Beer", segment: "Beer", country: "Belgium", color: "", price: [4, 9], styles: ["Tripel", "Blonde", "Witbier"] },
  { name: "Ready-to-drink", segment: "Coolers", country: "Canada", color: "", price: [4, 8], styles: ["Gin Tonic", "Vodka Soda", "Spritz"] },
];

// [name, home country, agent index, categories it sells in, sku count]
// agent 0 is "Your Agency"
const SUPPLIERS: [string, string, number, string[], number][] = [
  ["Domaine des Trois Collines", "France", 0, ["Red · France Rhône", "Rosé · France Provence", "White · France Burgundy"], 12],
  ["Tenuta Valfiorita", "Italy", 0, ["Red · Italy", "White · Italy", "Sparkling · Italy"], 14],
  ["Bodega Sierra Alta", "Spain", 0, ["Red · Spain", "Rosé · Spain", "Sparkling · Spain", "White · Spain"], 13],
  ["Kōwhai Ridge", "New Zealand", 0, ["White · New Zealand", "Red · New Zealand"], 9],
  ["Quinta do Rio Claro", "Portugal", 0, ["Red · Portugal", "White · Portugal"], 9],
  ["Viña Cordillera Sur", "Chile", 0, ["Red · Chile", "Red · Argentina", "White · Chile"], 11],
  ["Château Lavergne-Haut", "France", 0, ["Red · France Bordeaux"], 7],
  ["Weingut Steinhalde", "Germany", 0, ["White · Germany", "White · Austria"], 6],
  ["Maison Fleury Frères", "France", 0, ["Sparkling · Champagne"], 4],
  ["Glen Aird Distillers", "United Kingdom", 0, ["Scotch Whisky", "Gin"], 6],
  ["Cidrerie du Verger Blanc", "Canada", 0, ["Cider"], 4],
  ["Ktima Aspros Lofos", "Greece", 0, ["Red · Greece", "White · Greece"], 6],
  ["Château Belle-Rive", "France", 1, ["Red · France Bordeaux", "White · France Burgundy"], 12],
  ["Cantina Monteverro", "Italy", 1, ["Red · Italy", "White · Italy"], 14],
  ["Familia Andrade", "Argentina", 1, ["Red · Argentina", "White · Argentina"], 12],
  ["Isla Caña Rum Co.", "Barbados", 1, ["Rum"], 5],
  ["Coldwater Bay Cellars", "United States", 1, ["Red · United States", "White · United States"], 13],
  ["Domaine Saint-Aurèle", "France", 2, ["Red · France Rhône", "Rosé · France Provence"], 11],
  ["Bodegas Peña Roja", "Spain", 2, ["Red · Spain", "Rosé · Spain", "White · Spain"], 15],
  ["Southern Cross Estate", "Australia", 2, ["Red · Australia", "White · Australia"], 12],
  ["Hacienda Agave Real", "Mexico", 2, ["Tequila"], 5],
  ["Fattoria del Colle Alto", "Italy", 3, ["Red · Italy", "Sparkling · Italy", "Rosé · Italy"], 16],
  ["Wairau Stone", "New Zealand", 3, ["White · New Zealand", "Red · New Zealand"], 10],
  ["Kaapse Berg Wines", "South Africa", 3, ["White · South Africa", "Red · South Africa"], 10],
  ["Brouwerij De Drie Klokken", "Belgium", 3, ["Imported Beer"], 6],
  ["Maison Cordelier", "France", 4, ["Sparkling · Champagne", "White · France Burgundy"], 8],
  ["Casa do Vale Verde", "Portugal", 4, ["Red · Portugal", "White · Portugal"], 10],
  ["Valle Escondido", "Chile", 4, ["Red · Chile", "White · Chile"], 12],
  ["Northline Spirits", "Canada", 4, ["Gin", "Ready-to-drink"], 8],
  ["Weinhaus Rebenhof", "Austria", 5, ["White · Austria", "White · Germany", "Red · Austria"], 11],
  ["Redwood Hollow Vineyards", "United States", 5, ["Red · United States", "Rosé · United States"], 12],
  ["Bodega Viento Norte", "Argentina", 5, ["Red · Argentina", "White · Argentina"], 11],
  ["Château Moulin-Gris", "France", 6, ["Red · France Bordeaux"], 9],
  ["Cantine Lago Scuro", "Italy", 6, ["White · Italy", "Red · Italy", "Rosé · Italy"], 13],
  ["Highland Burn Whisky", "United Kingdom", 6, ["Scotch Whisky"], 6],
  ["Cave Coopérative des Oliviers", "France", 7, ["Rosé · France Provence", "Red · France Rhône"], 9],
  ["Cavas Torre Blanca", "Spain", 7, ["Sparkling · Spain", "Red · Spain"], 8],
  ["Ironbark Creek", "Australia", 7, ["Red · Australia", "White · Australia"], 10],
  ["Domaine de la Source Claire", "France", 8, ["White · France Burgundy"], 7],
  ["Pomme d'Or Cidrerie", "Canada", 8, ["Cider"], 5],
  ["Lakeview Coolers", "Canada", 8, ["Ready-to-drink"], 6],
  ["Tenuta Sant'Elia", "Italy", 9, ["Red · Italy", "Sparkling · Italy"], 11],
  ["Monte Azul Wines", "Chile", 9, ["Red · Chile", "White · Chile"], 9],
  ["Oinos Kalimera", "Greece", 9, ["Red · Greece", "White · Greece"], 7],
  ["Bodegas Lomas del Sol", "Spain", 10, ["Red · Spain", "White · Spain"], 12],
  ["Boschendal Vlei", "South Africa", 10, ["White · South Africa", "Red · South Africa"], 9],
  ["Agave Luna Azul", "Mexico", 10, ["Tequila"], 4],
  ["Rheinterrassen Kellerei", "Germany", 11, ["White · Germany"], 6],
  ["Pacific Crest Cellars", "United States", 11, ["Red · United States", "White · United States"], 11],
  ["Brasserie Mont-Rouge", "Belgium", 11, ["Imported Beer"], 5],
];

const AGENTS = [
  OUR_AGENT,
  "Agency B", "Agency C", "Agency D", "Agency E", "Agency F",
  "Agency G", "Agency H", "Agency I", "Agency J", "Agency K", "Agency L",
];

// wine agencies: wine carries the volume, spirits are a small premium tail
const SEGMENT_SCALE: Record<string, number> = {
  Wines: 1,
  Sparkling: 0.55,
  Spirits: 0.2,
  Ciders: 0.5,
  Beer: 1.1,
  Coolers: 0.9,
};

// how big each agency's book is relative to the others
const AGENT_SCALE = [1.15, 1.35, 1.2, 1.05, 0.95, 0.9, 1.0, 0.8, 0.75, 0.85, 0.7, 0.65];

function round(x: number) {
  return Math.round(x);
}

function iso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function brandNames(supplier: string, rand: () => number): string[] {
  const words = supplier
    .replace(/^(Domaine|Château|Tenuta|Bodega|Bodegas|Quinta|Viña|Weingut|Maison|Cantina|Cantine|Familia|Fattoria|Casa|Cave|Cavas|Hacienda|Ktima|Brouwerij|Brasserie|Weinhaus)\s+(des|du|de la|de|do|del|d')?\s*/i, "")
    .replace(/\s+(Co\.|Cellars|Estate|Wines|Vineyards|Distillers|Spirits|Whisky|Coolers|Kellerei|Cidrerie)$/i, "")
    .trim();
  const base = words || supplier;
  const extras = ["Reserve", "Origine", "Terroir", "Les Pierres", "Signature", "Heritage"];
  const n = 1 + Math.floor(rand() * 3);
  const out = [base];
  for (let i = 1; i < n; i++) out.push(`${base} ${extras[Math.floor(rand() * extras.length)]}`);
  return [...new Set(out)];
}

let cache: Row[] | null = null;

export function getRows(): Row[] {
  if (cache) return cache;
  const rand = mulberry32(20261015);
  const normal = () => {
    const u = Math.max(rand(), 1e-9);
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const rows: Row[] = [];
  let codeSeq = 10450;

  for (const [supplier, , agentIdx, catNames, skuCount] of SUPPLIERS) {
    const brands = brandNames(supplier, rand);
    const supStrength = Math.exp(normal() * 0.45) * AGENT_SCALE[agentIdx];
    // supplier-level momentum; the demo agency's book leans positive, with a few decliners
    const supTrend = normal() * 0.07 + (agentIdx === 0 ? 0.07 : 0.03);
    for (let i = 0; i < skuCount; i++) {
      const cat = CATS.find((c) => c.name === catNames[i % catNames.length])!;
      const brand = brands[Math.floor(rand() * brands.length)];
      const style = cat.styles[Math.floor(rand() * cat.styles.length)];
      const vintage = cat.segment === "Wines" && rand() < 0.6 ? ` ${2019 + Math.floor(rand() * 5)}` : "";
      const tRoll = rand();
      const type: ListingType = tRoll < 0.5 ? "RA" : tRoll < 0.8 ? "SA" : "SL";
      const status = rand() < 0.93 ? "Active" : "Inactive";

      // listing date: RA are mostly legacy, SA / SL are recent
      let ins: string;
      let launchYear: number;
      if (type === "RA" && rand() < 0.75) {
        ins = "5 years +";
        launchYear = 2008 + Math.floor(rand() * 13);
      } else {
        const back = type === "RA" ? 300 + rand() * 1500 : rand() * 1000;
        const d = new Date(DEMO_TODAY.getTime() - back * 86400000);
        ins = iso(d);
        launchYear = d.getFullYear();
      }

      const px = round((cat.price[0] + rand() * (cat.price[1] - cat.price[0])) * 100) / 100 - 0.01;
      const pxL = round(px / (1 + 0.01 + rand() * 0.04) * 100) / 100;
      const sizeBase = type === "RA" ? 2600 : type === "SA" ? 700 : 180;
      const ry = round(sizeBase * supStrength * Math.exp(normal() * 0.85) * (SEGMENT_SCALE[cat.segment] ?? 1));
      const g = supTrend + normal() * 0.15;
      const isNewThisYear = launchYear >= 2026;
      const ryL = isNewThisYear ? 0 : round(ry / Math.max(1 + g, 0.25) * (launchYear === 2025 ? 0.45 : 1));
      const part = (share: number, noise: number, base: number) =>
        Math.max(0, round(base * share * (1 + normal() * noise)));
      // SAQ periods: 13 per year; the demo sits around period 8
      const dormant = type === "SL" && rand() < 0.35;
      const r1 = dormant ? 0 : part(1 / 13, 0.35, ry);
      const r1L = part(1 / 13, 0.35, ryL);
      const r3 = part(3 / 13, 0.2, ry);
      const r3L = part(3 / 13, 0.2, ryL);
      const r6 = part(6 / 13, 0.12, ry);
      const r6L = part(6 / 13, 0.12, ryL);
      const yt = part(8 / 13, 0.08, ry);
      const ytL = part(8 / 13, 0.08, ryL);
      const d = round(ry * 12 * px * 0.97);
      const dL = round(ryL * 12 * pxL * 0.97);

      // channels: retail carries most of the volume
      const mix = [0.55 + rand() * 0.2, 0.1 + rand() * 0.15, 0.05 + rand() * 0.1, rand() * 0.12];
      const mixSum = mix.reduce((a, b) => a + b, 0);
      const ch = mix.map((m) => round((ry * m) / mixSum));
      const chL = mix.map((m) => round((ryL * m * (1 + normal() * 0.15)) / mixSum));

      const stT = Math.max(type === "SL" ? 1 : 5, round(Math.sqrt(ry) * (type === "RA" ? 6 : 3.5) * (0.8 + rand() * 0.4)));
      const stL = ryL > 0 ? Math.max(1, round(stT / (1 + g * 0.6))) : 0;

      // ten-year history (calendar years), built backwards from LY volume
      const hist: number[] = [];
      const histD: number[] = [];
      const anchor = ryL > 0 ? ryL : ry * 0.4;
      for (let y = FIRST_YEAR; y <= MAX_YEAR; y++) {
        let v = 0;
        if (y >= launchYear && !(type === "SL" && rand() < 0.3)) {
          const yearsBack = MAX_YEAR - y;
          v = anchor * Math.pow(1 + supTrend + 0.02, -yearsBack) * (1 + normal() * 0.12);
          if (y === launchYear) v *= 0.45;
          if (y === 2020 && cat.segment !== "Coolers") v *= 1.12; // the at-home bump
        }
        v = Math.max(0, round(v));
        hist.push(v);
        histD.push(round(v * 12 * px * Math.pow(0.975, MAX_YEAR - y)));
      }

      rows.push({
        code: String(codeSeq++ * 7).padStart(8, "1"),
        desc: `${brand} ${style}${vintage}`,
        agent: AGENTS[agentIdx],
        supplier,
        brand,
        country: cat.country,
        category: cat.name,
        segment: cat.segment,
        color: cat.color,
        type,
        status,
        ins,
        format: cat.segment === "Beer" || cat.segment === "Coolers" ? 473 : 750,
        px, pxL, stT, stL,
        r1, r1L, r3, r3L, r6, r6L, yt, ytL, ry, ryL, d, dL,
        c1: ch[0], c1L: chL[0], c2: ch[1], c2L: chL[1], c3: ch[2], c3L: chL[2], c4: ch[3], c4L: chL[3],
        hist, histD,
      });
    }
  }
  // SA and SL come out of the loop recent and small, which leaves the
  // ten-year history almost all RA. Re-list a share of the established RA
  // SKUs as SA / SL from their own stream, so no volume or rank moves.
  const relist = mulberry32(7);
  for (const r of rows) {
    if (r.type !== "RA") continue;
    const x = relist();
    if (x < 0.16) r.type = "SA";
    else if (x < 0.24) r.type = "SL";
  }

  cache = rows;
  return rows;
}

export function ourSuppliers(): string[] {
  const rows = getRows().filter((r) => r.agent === OUR_AGENT);
  const bySales = new Map<string, number>();
  for (const r of rows) bySales.set(r.supplier, (bySales.get(r.supplier) ?? 0) + r.d);
  return [...bySales.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
}

// the supplier the demo opens on: the biggest one that is growing
export function featuredSupplier(): string {
  const rows = getRows().filter((r) => r.agent === OUR_AGENT);
  for (const s of ourSuppliers()) {
    const rs = rows.filter((r) => r.supplier === s);
    if (rs.reduce((a, r) => a + r.d, 0) > rs.reduce((a, r) => a + r.dL, 0)) return s;
  }
  return ourSuppliers()[0];
}
