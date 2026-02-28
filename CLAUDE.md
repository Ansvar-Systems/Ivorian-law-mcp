# Ivory Coast Law MCP Server -- Developer Guide

## Git Workflow

- **Never commit directly to `main`.** Always create a feature branch and open a Pull Request.
- Branch protection requires: verified signatures, PR review, and status checks to pass.
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, etc.

## Project Overview

Ivory Coast (Cote d'Ivoire) Law MCP server providing Ivorian legislation search via Model Context Protocol. Strategy A deployment (Vercel, bundled SQLite DB). Comprehensive census of 1,942 primary laws (LOI + ORDONNANCE) from biblio.cndj.ci, with full provision text for 11 key laws covering data protection, cybercrime, electronic transactions, penal code, labor, telecoms, AML/CFT, and more.

## Architecture

- **Transport:** Dual-channel -- stdio (npm package) + Streamable HTTP (Vercel serverless)
- **Database:** SQLite + FTS5 via `@ansvar/mcp-sqlite` (WASM-compatible, no WAL mode)
- **Entry points:** `src/index.ts` (stdio), `api/mcp.ts` (Vercel HTTP)
- **Tool registry:** `src/tools/registry.ts` -- shared between both transports
- **Capability gating:** `src/capabilities.ts` -- detects available DB tables at runtime

## Key Conventions

- All database queries use parameterized statements (never string interpolation)
- FTS5 queries go through `buildFtsQueryVariants()` with primary + fallback strategy
- User input is sanitized via `sanitizeFtsInput()` before FTS5 queries
- Every tool returns `ToolResponse<T>` with `results` + `_metadata` (freshness, disclaimer)
- Tool descriptions are written for LLM agents -- explain WHEN and WHY to use each tool
- Capability-gated tools only appear in `tools/list` when their DB tables exist
- Ivorian legislation uses "Article N" for both laws and the Constitution

## Testing

- Unit tests: `tests/` (vitest, in-memory SQLite fixtures)
- Contract tests: `__tests__/contract/golden.test.ts` with `fixtures/golden-tests.json`
- Nightly mode: `CONTRACT_MODE=nightly` enables network assertions
- Run: `npm test` (unit), `npm run test:contract` (golden), `npm run validate` (both)

## Database

- Schema defined inline in `scripts/build-db.ts`
- Journal mode: DELETE (not WAL -- required for Vercel serverless)
- Runtime: copied to `/tmp/database.db` on Vercel cold start
- Metadata: `db_metadata` table stores tier, schema_version, built_at, builder
- Contains 1,942 documents (11 with full provisions, 1,931 metadata only)

## Data Pipeline

1. `scripts/census.ts` -> scrapes biblio.cndj.ci listings -> `data/census.json`
2. `scripts/ingest.ts` -> fetches law full text -> JSON seed files in `data/seed/`
3. `scripts/build-db.ts` -> seed JSON + census metadata -> SQLite `data/database.db`
4. `scripts/drift-detect.ts` -> verifies upstream content hasn't changed

## Data Source

- **CNDJ** (biblio.cndj.ci) -- Centre National de Documentation Juridique
- **License:** Government Publication
- **Languages:** French (fr) is the sole legal language
- **Coverage:** 1,942 primary laws enumerated (LOI + ORDONNANCE), 11 with full provisions
- **Limitation:** Full text on biblio.cndj.ci requires authenticated login; census metadata is public

## Cote d'Ivoire-Specific Notes

- Cote d'Ivoire uses a civil law legal system inherited from French colonial administration
- The Constitution of 8 November 2016 is the supreme law
- Legislation is identified by type + number + date (e.g., "Loi n. 2013-450 du 19 juin 2013")
- Citations follow the pattern: "Article N, [Loi/Ordonnance n. YEAR-NUMBER]"
- The data protection authority is ARTCI (Autorite de Regulation des Telecommunications de Cote d'Ivoire)
- Loi n. 2013-450 is the primary data protection law (influenced by French model, not GDPR directly)
- Loi n. 2013-451 is the cybercrime law
- Cote d'Ivoire is a member of OHADA (harmonized business law) and UEMOA (West African Economic Union)
- The CNDJ digital library contains 29,455+ legal texts (all types including decrets, arretes)
- The Journal officiel (JO) is the official publication vehicle for all legislation

## Deployment

- Vercel Strategy A: DB bundled in `data/database.db`, included via `vercel.json` includeFiles
- npm package: `@ansvar/ivorian-law-mcp` with bin entry for stdio
