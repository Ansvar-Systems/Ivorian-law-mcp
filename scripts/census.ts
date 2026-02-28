#!/usr/bin/env tsx
/**
 * Ivory Coast (Cote d'Ivoire) Law MCP -- Census Script (Golden Standard)
 *
 * Enumerates ALL Ivorian primary legislation from biblio.cndj.ci:
 *   - LOI (nature=8): ~1,708 laws
 *   - ORDONNANCE (nature=12): ~587 ordinances
 *
 * The CNDJ digital library (biblio.cndj.ci) is the authoritative source
 * for Ivorian legislation, maintained by the Centre National de
 * Documentation Juridique under the Ministry of Justice.
 *
 * Search/listing pages are publicly accessible (no auth).
 * Full text detail pages require authentication (biblio.cndj.ci login).
 *
 * Outputs data/census.json in golden standard format.
 *
 * Usage:
 *   npx tsx scripts/census.ts                     # Full census
 *   npx tsx scripts/census.ts --nature loi        # Only LOI
 *   npx tsx scripts/census.ts --nature ordonnance # Only ORDONNANCE
 *   npx tsx scripts/census.ts --page-limit 5      # Test with 5 pages
 *   npx tsx scripts/census.ts --curated-only      # Skip scraping, curated list only
 *
 * Source: biblio.cndj.ci (CNDJ digital library)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const CENSUS_PATH = path.join(DATA_DIR, 'census.json');
const SEED_DIR = path.join(DATA_DIR, 'seed');

/* ---------- Constants ---------- */

const CNDJ_BASE = 'https://biblio.cndj.ci';
const SEARCH_URL = `${CNDJ_BASE}/search/textes`;

// Nature IDs on biblio.cndj.ci
const NATURE_LOI = '8';
const NATURE_ORDONNANCE = '12';

const RESULTS_PER_PAGE = 10; // CNDJ always returns 10 regardless of per_page param
const RATE_LIMIT_MS = 800;   // Be respectful to government servers

const USER_AGENT = 'ivorian-law-mcp/1.0 (https://github.com/Ansvar-Systems/ivorian-law-mcp; hello@ansvar.eu)';

/* ---------- Types ---------- */

interface CensusLawEntry {
  id: string;
  cndj_id: string | null;
  title: string;
  identifier: string;
  url: string;
  status: 'in_force' | 'amended' | 'repealed';
  category: 'loi' | 'ordonnance' | 'decret' | 'constitution' | 'traite';
  classification: 'ingestable' | 'excluded' | 'inaccessible' | 'auth_required';
  ingested: boolean;
  provision_count: number;
  ingestion_date: string | null;
  signature_date: string | null;
  jo_reference: string | null;
}

interface CensusFile {
  schema_version: string;
  jurisdiction: string;
  jurisdiction_name: string;
  portal: string;
  census_date: string;
  agent: string;
  source_stats: {
    loi_total: number;
    ordonnance_total: number;
    pages_scraped: number;
    scrape_duration_seconds: number;
  };
  summary: {
    total_laws: number;
    ingestable: number;
    auth_required: number;
    ocr_needed: number;
    inaccessible: number;
    excluded: number;
    ingested: number;
    total_provisions: number;
  };
  laws: CensusLawEntry[];
}

interface ScrapedEntry {
  cndj_id: string;
  title: string;
  number: string;
  signature_date: string;
  jo_reference: string;
  nature: 'loi' | 'ordonnance';
}

/* ---------- CLI args ---------- */

interface CliArgs {
  nature: 'all' | 'loi' | 'ordonnance';
  pageLimit: number | null;
  curatedOnly: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let nature: CliArgs['nature'] = 'all';
  let pageLimit: number | null = null;
  let curatedOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--nature' && args[i + 1]) {
      const val = args[++i].toLowerCase();
      if (val === 'loi' || val === 'ordonnance') nature = val;
    } else if (args[i] === '--page-limit' && args[i + 1]) {
      pageLimit = parseInt(args[++i], 10);
    } else if (args[i] === '--curated-only') {
      curatedOnly = true;
    }
  }

  return { nature, pageLimit, curatedOnly };
}

/* ---------- Helpers ---------- */

function titleToId(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 120);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseDateDMY(dmy: string): string | null {
  // "19/12/2025" -> "2025-12-19"
  const m = dmy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

function normalizeTitle(raw: string): string {
  return raw
    .replace(/\.\.\s*$/, '')
    .replace(/\s+/g, ' ')
    .replace(/`/g, "'")
    .trim();
}

function extractIdentifier(title: string): string {
  // "LOI N° 2025-987 du 19/12/2025, portant ..." -> "Loi n° 2025-987"
  const m = title.match(/^(LOI|ORDONNANCE)\s+N[°o]\s*(\d[\d-]+)/i);
  if (m) {
    const type = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    return `${type} n\u00b0 ${m[2]}`;
  }
  // Fallback: use first 60 chars
  return title.substring(0, 60);
}

/* ---------- Scraping ---------- */

/**
 * Fetch a single search results page from biblio.cndj.ci.
 * Returns the raw HTML.
 */
async function fetchPage(natureId: string, page: number): Promise<string> {
  const url = `${SEARCH_URL}?type=1&nature=${natureId}&page=${page}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,*/*',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for page ${page} nature=${natureId}`);
  }

  return res.text();
}

/**
 * Extract the total result count from a CNDJ search page.
 */
function extractTotalCount(html: string): number {
  // Pattern: <div class="result-stats..."><h5 ...>\n  1708\n  résultats\n  trouvés
  const m = html.match(/result-stats[^"]*">\s*<h5[^>]*>\s*(\d[\d\s]*)\s*r[eé]sultats?/);
  if (m) {
    return parseInt(m[1].replace(/\s/g, ''), 10);
  }
  return 0;
}

/**
 * Parse result cards from a CNDJ search page.
 */
function parseResultCards(html: string, nature: 'loi' | 'ordonnance'): ScrapedEntry[] {
  const entries: ScrapedEntry[] = [];

  // Split on result-card boundaries
  const cardRegex = /<div\s+class="card\s+result-card"[^>]*>([\s\S]*?)(?=<div\s+class="card\s+result-card"|<\/div>\s*<!--\[if ENDBLOCK\]|<nav\b)/g;
  let cardMatch: RegExpExecArray | null;

  while ((cardMatch = cardRegex.exec(html)) !== null) {
    const card = cardMatch[1];

    // Extract CNDJ ID and title from link
    const linkMatch = card.match(
      /href="https:\/\/biblio\.cndj\.ci\/search\/textes\/(\d+)\?type=1"[^>]*>\s*([\s\S]*?)<\/a>/
    );
    if (!linkMatch) continue;

    const cndjId = linkMatch[1];
    const rawTitle = linkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    // Extract number
    const numMatch = card.match(/Num[eé]ro<\/span>\s*([^<]+)/);
    const number = numMatch ? numMatch[1].trim() : '';

    // Extract signature date
    const dateMatch = card.match(/Date\s+signature<\/span>\s*([^<]+)/);
    const sigDate = dateMatch ? dateMatch[1].trim() : '';

    // Extract Journal Officiel reference
    const joMatch = card.match(/Journal\s+officiel<\/span>\s*([\s\S]*?)(?:<\/li>|<\/ul>)/);
    const joRef = joMatch
      ? joMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      : '';

    entries.push({
      cndj_id: cndjId,
      title: normalizeTitle(rawTitle),
      number: number,
      signature_date: sigDate,
      jo_reference: joRef,
      nature,
    });
  }

  return entries;
}

/**
 * Scrape all pages for a given nature (LOI or ORDONNANCE).
 */
async function scrapeNature(
  natureId: string,
  natureName: 'loi' | 'ordonnance',
  pageLimit: number | null,
): Promise<{ entries: ScrapedEntry[]; total: number; pages: number }> {
  console.log(`\n  Scraping ${natureName.toUpperCase()} (nature=${natureId})...`);

  // Fetch page 1 to get total count
  const firstPageHtml = await fetchPage(natureId, 1);
  const total = extractTotalCount(firstPageHtml);
  const totalPages = total > 0 ? Math.ceil(total / RESULTS_PER_PAGE) : 200; // fallback: 200 pages
  const maxPages = pageLimit ? Math.min(pageLimit, totalPages) : totalPages;

  console.log(`    Total: ${total > 0 ? total : '(unknown)'} entries across ${total > 0 ? totalPages : '~200 (estimated)'} pages`);
  console.log(`    Scraping: ${maxPages} pages`);

  const allEntries: ScrapedEntry[] = [];

  // Parse page 1
  const page1Entries = parseResultCards(firstPageHtml, natureName);
  allEntries.push(...page1Entries);
  console.log(`    Page 1: ${page1Entries.length} entries`);

  // Fetch remaining pages
  for (let page = 2; page <= maxPages; page++) {
    await sleep(RATE_LIMIT_MS);

    try {
      const html = await fetchPage(natureId, page);
      const entries = parseResultCards(html, natureName);
      allEntries.push(...entries);

      if (page % 20 === 0 || page === maxPages) {
        console.log(`    Page ${page}/${maxPages}: ${allEntries.length} total entries`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`    Page ${page}: ERROR - ${msg}`);
      // Continue to next page
    }
  }

  return { entries: allEntries, total, pages: maxPages };
}

/* ---------- Curated laws (manual fallback) ---------- */

interface CuratedLaw {
  title: string;
  identifier: string;
  category: CensusLawEntry['category'];
}

const CURATED_LAWS: CuratedLaw[] = [
  // Constitution (not a LOI, won't appear in CNDJ LOI search)
  { title: "Constitution de la R\u00e9publique de C\u00f4te d'Ivoire du 8 novembre 2016", identifier: 'Constitution 2016', category: 'constitution' },
  // OHADA Treaty (international, not in LOI search)
  { title: "Trait\u00e9 OHADA relatif \u00e0 l'harmonisation du droit des affaires en Afrique", identifier: 'Trait\u00e9 OHADA', category: 'traite' },
  // UEMOA Banking (regional, not in LOI search)
  { title: 'Loi cadre portant r\u00e9glementation bancaire (UEMOA)', identifier: 'Loi bancaire UEMOA', category: 'loi' },
  // Public procurement (DECRET, not in LOI or ORDONNANCE search)
  { title: "D\u00e9cret n\u00b0 2009-259 du 6 ao\u00fbt 2009 portant Code des march\u00e9s publics", identifier: 'D\u00e9cret n\u00b0 2009-259', category: 'decret' },
];

/* ---------- Main ---------- */

async function main(): Promise<void> {
  const { nature, pageLimit, curatedOnly } = parseArgs();

  console.log("Ivory Coast (C\u00f4te d'Ivoire) Law MCP -- Census (Golden Standard)");
  console.log('=================================================================\n');
  console.log('  Source: biblio.cndj.ci (CNDJ digital library)');
  console.log('  Language: French');
  console.log('  License: Government Publication');

  if (curatedOnly) {
    console.log('  Mode: --curated-only (skip scraping)');
  } else {
    console.log(`  Nature filter: ${nature}`);
    if (pageLimit) console.log(`  Page limit: ${pageLimit}`);
  }

  // Load existing census to preserve ingestion state
  const existingMap = new Map<string, CensusLawEntry>();
  if (fs.existsSync(CENSUS_PATH)) {
    try {
      const prev = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf-8')) as CensusFile;
      for (const law of prev.laws) {
        existingMap.set(law.id, law);
      }
      console.log(`\n  Loaded ${existingMap.size} existing entries`);
    } catch { /* ignore corrupt file */ }
  }

  // Check which IDs have seed files (already ingested)
  const seedFiles = new Set<string>();
  if (fs.existsSync(SEED_DIR)) {
    for (const f of fs.readdirSync(SEED_DIR)) {
      if (f.endsWith('.json')) {
        seedFiles.add(f.replace('.json', ''));
      }
    }
  }

  const startTime = Date.now();
  let loiTotal = 0;
  let ordTotal = 0;
  let pagesScraped = 0;
  const allScraped: ScrapedEntry[] = [];

  if (!curatedOnly) {
    // Scrape LOI
    if (nature === 'all' || nature === 'loi') {
      const loi = await scrapeNature(NATURE_LOI, 'loi', pageLimit);
      allScraped.push(...loi.entries);
      loiTotal = loi.total;
      pagesScraped += loi.pages;
    }

    // Scrape ORDONNANCE
    if (nature === 'all' || nature === 'ordonnance') {
      const ord = await scrapeNature(NATURE_ORDONNANCE, 'ordonnance', pageLimit);
      allScraped.push(...ord.entries);
      ordTotal = ord.total;
      pagesScraped += ord.pages;
    }
  }

  const duration = (Date.now() - startTime) / 1000;

  // Build census entries from scraped data
  const censusMap = new Map<string, CensusLawEntry>();

  // First, add scraped entries
  for (const scraped of allScraped) {
    const id = titleToId(scraped.title);
    const existing = existingMap.get(id);
    const hasSeed = seedFiles.has(id);
    const isoDate = parseDateDMY(scraped.signature_date);

    const entry: CensusLawEntry = {
      id,
      cndj_id: scraped.cndj_id,
      title: scraped.title,
      identifier: extractIdentifier(scraped.title),
      url: `${CNDJ_BASE}/search/textes/${scraped.cndj_id}?type=1`,
      status: existing?.status ?? 'in_force',
      category: scraped.nature,
      // Detail pages require auth, but we have the listing metadata
      classification: hasSeed ? 'ingestable' : (existing?.classification === 'ingestable' ? 'ingestable' : 'auth_required'),
      ingested: hasSeed || (existing?.ingested ?? false),
      provision_count: existing?.provision_count ?? 0,
      ingestion_date: existing?.ingestion_date ?? null,
      signature_date: isoDate,
      jo_reference: scraped.jo_reference || null,
    };

    // Deduplicate by ID (keep most recent)
    if (!censusMap.has(id) || (censusMap.get(id)!.cndj_id === null)) {
      censusMap.set(id, entry);
    }
  }

  // Then add curated laws (if not already from scraping)
  for (const curated of CURATED_LAWS) {
    const id = titleToId(curated.title);
    if (!censusMap.has(id)) {
      const existing = existingMap.get(id);
      const hasSeed = seedFiles.has(id);

      censusMap.set(id, {
        id,
        cndj_id: null,
        title: curated.title,
        identifier: curated.identifier,
        url: 'https://www.cndj.ci',
        status: existing?.status ?? 'in_force',
        category: curated.category,
        classification: hasSeed ? 'ingestable' : (existing?.classification ?? 'ingestable'),
        ingested: hasSeed || (existing?.ingested ?? false),
        provision_count: existing?.provision_count ?? 0,
        ingestion_date: existing?.ingestion_date ?? null,
        signature_date: null,
        jo_reference: null,
      });
    }
  }

  // Also preserve any existing entries that we did not re-scrape
  // (e.g. if --nature loi, keep ordonnance entries from previous census)
  for (const [id, existing] of existingMap) {
    if (!censusMap.has(id)) {
      censusMap.set(id, existing);
    }
  }

  // Sort alphabetically
  const allLaws = Array.from(censusMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title, 'fr'),
  );

  // Compute summary
  const today = new Date().toISOString().split('T')[0];
  const ingestable = allLaws.filter(l => l.classification === 'ingestable').length;
  const authRequired = allLaws.filter(l => l.classification === 'auth_required').length;
  const inaccessible = allLaws.filter(l => l.classification === 'inaccessible').length;
  const excluded = allLaws.filter(l => l.classification === 'excluded').length;
  const ingested = allLaws.filter(l => l.ingested).length;
  const totalProvisions = allLaws.reduce((sum, l) => sum + l.provision_count, 0);

  const census: CensusFile = {
    schema_version: '2.0',
    jurisdiction: 'CI',
    jurisdiction_name: "C\u00f4te d'Ivoire",
    portal: 'https://biblio.cndj.ci',
    census_date: today,
    agent: 'census.ts (biblio.cndj.ci scraper)',
    source_stats: {
      loi_total: loiTotal,
      ordonnance_total: ordTotal,
      pages_scraped: pagesScraped,
      scrape_duration_seconds: Math.round(duration),
    },
    summary: {
      total_laws: allLaws.length,
      ingestable,
      auth_required: authRequired,
      ocr_needed: 0,
      inaccessible,
      excluded,
      ingested,
      total_provisions: totalProvisions,
    },
    laws: allLaws,
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));

  console.log('\n=================================================================');
  console.log('Census Complete');
  console.log('=================================================================\n');
  console.log(`  Source stats:`);
  console.log(`    LOI on CNDJ:           ${loiTotal}`);
  console.log(`    ORDONNANCE on CNDJ:    ${ordTotal}`);
  console.log(`    Pages scraped:         ${pagesScraped}`);
  console.log(`    Duration:              ${Math.round(duration)}s`);
  console.log(`\n  Census summary:`);
  console.log(`    Total enumerated:      ${allLaws.length}`);
  console.log(`    Ingestable (with seed):${ingestable}`);
  console.log(`    Auth required:         ${authRequired}`);
  console.log(`    Inaccessible:          ${inaccessible}`);
  console.log(`    Excluded:              ${excluded}`);
  console.log(`    Already ingested:      ${ingested}`);
  console.log(`    Total provisions:      ${totalProvisions}`);

  // Category breakdown
  const byCategory = new Map<string, number>();
  for (const law of allLaws) {
    byCategory.set(law.category, (byCategory.get(law.category) ?? 0) + 1);
  }
  console.log(`\n  By category:`);
  for (const [cat, count] of Array.from(byCategory.entries()).sort()) {
    console.log(`    ${cat}: ${count}`);
  }

  // Year distribution (top 10)
  const byYear = new Map<string, number>();
  for (const law of allLaws) {
    if (law.signature_date) {
      const year = law.signature_date.substring(0, 4);
      byYear.set(year, (byYear.get(year) ?? 0) + 1);
    }
  }
  const topYears = Array.from(byYear.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  if (topYears.length > 0) {
    console.log(`\n  Top 10 years by count:`);
    for (const [year, count] of topYears) {
      console.log(`    ${year}: ${count}`);
    }
  }

  console.log(`\n  Output: ${CENSUS_PATH}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
