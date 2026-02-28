#!/usr/bin/env tsx
/**
 * Ivory Coast Law MCP -- Census-Driven Ingestion Pipeline
 *
 * Reads data/census.json and processes every ingestable law.
 *
 * For entries with existing seed files: validates and counts provisions.
 * For entries marked auth_required: attempts fetch from biblio.cndj.ci
 *   detail page. If login-redirected, marks as auth_required.
 *   If content found, parses French legislative text into provisions.
 *
 * Features:
 *   - Resume support: skips laws that already have a seed JSON file
 *   - Census update: writes provision counts + ingestion dates back to census.json
 *   - Rate limiting: 800ms minimum between requests
 *   - Checkpoint: saves census every 50 processed laws
 *
 * Usage:
 *   npm run ingest                    # Full census-driven ingestion
 *   npm run ingest -- --limit 5       # Test with 5 laws
 *   npm run ingest -- --skip-fetch    # Reuse cached HTML (re-parse only)
 *   npm run ingest -- --force         # Re-ingest even if seed exists
 *   npm run ingest -- --resume        # Only process non-ingested laws (default)
 *   npm run ingest -- --category loi  # Only process LOI category
 *
 * Data source: biblio.cndj.ci (CNDJ digital library)
 * License: Government Publication
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchWithRateLimit } from './lib/fetcher.js';
import { parseIvorianLawHtml, type ActIndexEntry, type ParsedAct } from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../data/source');
const SEED_DIR = path.resolve(__dirname, '../data/seed');
const CENSUS_PATH = path.resolve(__dirname, '../data/census.json');

/* ---------- Types (matching census.ts v2.0 schema) ---------- */

interface CensusLawEntry {
  id: string;
  cndj_id: string | null;
  title: string;
  identifier: string;
  url: string;
  status: 'in_force' | 'amended' | 'repealed';
  category: string;
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

/* ---------- CLI ---------- */

interface CliArgs {
  limit: number | null;
  skipFetch: boolean;
  force: boolean;
  category: string | null;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let skipFetch = false;
  let force = false;
  let category: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[++i], 10);
    } else if (args[i] === '--skip-fetch') {
      skipFetch = true;
    } else if (args[i] === '--force') {
      force = true;
    } else if (args[i] === '--category' && args[i + 1]) {
      category = args[++i].toLowerCase();
    }
  }

  return { limit, skipFetch, force, category };
}

/* ---------- Helpers ---------- */

function censusToActEntry(law: CensusLawEntry): ActIndexEntry {
  const shortName = law.title.length > 60
    ? law.title.substring(0, 57) + '...'
    : law.title;

  return {
    id: law.id,
    title: law.title,
    titleEn: law.title,
    shortName,
    status: law.status === 'in_force' ? 'in_force' : law.status === 'amended' ? 'amended' : 'repealed',
    issuedDate: law.signature_date ?? '',
    inForceDate: law.signature_date ?? '',
    url: law.url,
    description: law.jo_reference ? `Journal officiel: ${law.jo_reference}` : undefined,
  };
}

/**
 * Check if HTML content is a CNDJ login page (auth required).
 */
function isLoginPage(html: string): boolean {
  return html.includes('Mot de passe') && html.includes('Connexion') && html.includes('CNDJ');
}

function writeCensus(census: CensusFile, censusMap: Map<string, CensusLawEntry>): void {
  census.laws = Array.from(censusMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title, 'fr'),
  );

  census.summary.total_laws = census.laws.length;
  census.summary.ingestable = census.laws.filter(l => l.classification === 'ingestable').length;
  census.summary.auth_required = census.laws.filter(l => l.classification === 'auth_required').length;
  census.summary.inaccessible = census.laws.filter(l => l.classification === 'inaccessible').length;
  census.summary.excluded = census.laws.filter(l => l.classification === 'excluded').length;
  census.summary.ingested = census.laws.filter(l => l.ingested).length;
  census.summary.total_provisions = census.laws.reduce((sum, l) => sum + (l.provision_count ?? 0), 0);

  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));
}

/* ---------- Main ---------- */

async function main(): Promise<void> {
  const { limit, skipFetch, force, category } = parseArgs();

  console.log("Ivory Coast Law MCP -- Ingestion Pipeline (Census-Driven)");
  console.log('=========================================================\n');
  console.log('  Source: biblio.cndj.ci (CNDJ digital library)');
  console.log('  Format: French legislative HTML');
  console.log('  License: Government Publication');

  if (limit) console.log(`  --limit ${limit}`);
  if (skipFetch) console.log('  --skip-fetch');
  if (force) console.log('  --force (re-ingest all)');
  if (category) console.log(`  --category ${category}`);

  // Load census
  if (!fs.existsSync(CENSUS_PATH)) {
    console.error(`\nERROR: Census file not found at ${CENSUS_PATH}`);
    console.error('Run "npx tsx scripts/census.ts" first.');
    process.exit(1);
  }

  const census: CensusFile = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf-8'));

  // Filter to processable entries
  let candidates = census.laws.filter(l =>
    l.classification === 'ingestable' || l.classification === 'auth_required'
  );

  if (category) {
    candidates = candidates.filter(l => l.category === category);
  }

  const acts = limit ? candidates.slice(0, limit) : candidates;

  console.log(`\n  Census: ${census.summary.total_laws} total`);
  console.log(`  Processable: ${candidates.length} (ingestable: ${candidates.filter(l => l.classification === 'ingestable').length}, auth_required: ${candidates.filter(l => l.classification === 'auth_required').length})`);
  console.log(`  Processing: ${acts.length} laws\n`);

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(SEED_DIR, { recursive: true });

  let processed = 0;
  let ingested = 0;
  let skipped = 0;
  let failed = 0;
  let authBlocked = 0;
  let totalProvisions = 0;
  let totalDefinitions = 0;
  const results: { act: string; provisions: number; definitions: number; status: string }[] = [];

  const censusMap = new Map<string, CensusLawEntry>();
  for (const law of census.laws) {
    censusMap.set(law.id, law);
  }

  const today = new Date().toISOString().split('T')[0];

  for (const law of acts) {
    const act = censusToActEntry(law);
    const sourceFile = path.join(SOURCE_DIR, `${act.id}.html`);
    const seedFile = path.join(SEED_DIR, `${act.id}.json`);

    // Resume support: skip if seed already exists (unless --force)
    if (!force && fs.existsSync(seedFile)) {
      try {
        const existing = JSON.parse(fs.readFileSync(seedFile, 'utf-8')) as ParsedAct;
        const provCount = existing.provisions?.length ?? 0;
        const defCount = existing.definitions?.length ?? 0;
        totalProvisions += provCount;
        totalDefinitions += defCount;

        const entry = censusMap.get(law.id);
        if (entry) {
          entry.ingested = true;
          entry.classification = 'ingestable';
          entry.provision_count = provCount;
          entry.ingestion_date = entry.ingestion_date ?? today;
        }

        results.push({ act: act.shortName, provisions: provCount, definitions: defCount, status: 'resumed' });
        skipped++;
        processed++;
        continue;
      } catch {
        // Corrupt seed file, re-ingest
      }
    }

    try {
      let html: string;

      if (fs.existsSync(sourceFile) && skipFetch) {
        html = fs.readFileSync(sourceFile, 'utf-8');
        console.log(`  [${processed + 1}/${acts.length}] Using cached ${act.id} (${(html.length / 1024).toFixed(0)} KB)`);
      } else {
        process.stdout.write(`  [${processed + 1}/${acts.length}] Fetching ${act.id}...`);
        const result = await fetchWithRateLimit(act.url);

        if (result.status !== 200) {
          console.log(` HTTP ${result.status}`);
          const entry = censusMap.get(law.id);
          if (entry) entry.classification = 'inaccessible';
          results.push({ act: act.shortName, provisions: 0, definitions: 0, status: `HTTP ${result.status}` });
          failed++;
          processed++;
          continue;
        }

        html = result.body;

        // Check if we got a login page instead of content
        if (isLoginPage(html)) {
          console.log(' AUTH REQUIRED (login page)');
          const entry = censusMap.get(law.id);
          if (entry) entry.classification = 'auth_required';
          results.push({ act: act.shortName, provisions: 0, definitions: 0, status: 'auth_required' });
          authBlocked++;
          processed++;
          continue;
        }

        fs.writeFileSync(sourceFile, html);
        console.log(` OK (${(html.length / 1024).toFixed(0)} KB)`);
      }

      const parsed = parseIvorianLawHtml(html, act);
      fs.writeFileSync(seedFile, JSON.stringify(parsed, null, 2));
      totalProvisions += parsed.provisions.length;
      totalDefinitions += parsed.definitions.length;
      console.log(`    -> ${parsed.provisions.length} provisions, ${parsed.definitions.length} definitions`);

      const entry = censusMap.get(law.id);
      if (entry) {
        entry.ingested = true;
        entry.classification = 'ingestable';
        entry.provision_count = parsed.provisions.length;
        entry.ingestion_date = today;
      }

      results.push({
        act: act.shortName,
        provisions: parsed.provisions.length,
        definitions: parsed.definitions.length,
        status: 'OK',
      });
      ingested++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  ERROR parsing ${act.id}: ${msg}`);
      results.push({ act: act.shortName, provisions: 0, definitions: 0, status: `ERROR: ${msg.substring(0, 80)}` });
      failed++;
    }

    processed++;

    if (processed % 50 === 0) {
      writeCensus(census, censusMap);
      console.log(`  [checkpoint] Census updated at ${processed}/${acts.length}`);
    }
  }

  // Final census update
  writeCensus(census, censusMap);

  // Report
  console.log(`\n${'='.repeat(70)}`);
  console.log('Ingestion Report');
  console.log('='.repeat(70));
  console.log(`\n  Source:        biblio.cndj.ci (CNDJ digital library)`);
  console.log(`  Processed:     ${processed}`);
  console.log(`  New:           ${ingested}`);
  console.log(`  Resumed:       ${skipped}`);
  console.log(`  Auth blocked:  ${authBlocked}`);
  console.log(`  Failed:        ${failed}`);
  console.log(`  Total provisions:  ${totalProvisions}`);
  console.log(`  Total definitions: ${totalDefinitions}`);

  const failures = results.filter(r => r.status.startsWith('HTTP') || r.status.startsWith('ERROR'));
  if (failures.length > 0) {
    console.log(`\n  Failed laws:`);
    for (const f of failures) {
      console.log(`    ${f.act}: ${f.status}`);
    }
  }

  const zeroProv = results.filter(r =>
    r.provisions === 0 && r.status === 'OK'
  );
  if (zeroProv.length > 0) {
    console.log(`\n  Zero-provision laws (${zeroProv.length}):`);
    for (const z of zeroProv.slice(0, 20)) {
      console.log(`    ${z.act}`);
    }
    if (zeroProv.length > 20) {
      console.log(`    ... and ${zeroProv.length - 20} more`);
    }
  }

  console.log('');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
