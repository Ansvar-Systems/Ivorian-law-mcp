/**
 * build_legal_stance — Build a comprehensive set of citations for a legal question.
 */

import type Database from '@ansvar/mcp-sqlite';
import { buildFtsQueryVariants, buildLikePattern, sanitizeFtsInput } from '../utils/fts-query.js';
import { resolveDocumentId } from '../utils/statute-id.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import type { CitationBlock } from './search-legislation.js';

export interface BuildLegalStanceInput {
  query: string;
  document_id?: string;
  limit?: number;
}

export interface LegalStanceResult {
  document_id: string;
  document_title: string;
  provision_ref: string;
  section: string;
  title: string | null;
  snippet: string;
  relevance: number;
  _citation: CitationBlock;
}

type RawRow = Omit<LegalStanceResult, '_citation'>;

const RESEARCH_DISCLAIMER =
  'RESEARCH ONLY — not legal advice. ' +
  'Results are derived from database search and must be verified against official Ivorian legislation ' +
  'published in the Journal Officiel de Côte d\'Ivoire.';

function buildCitation(documentId: string, documentTitle: string, provisionRef: string): CitationBlock {
  const articleNum = provisionRef.replace(/^(?:s|art)/i, '');
  const lawMatch = documentId.match(/^(?:loi|ordonnance)-n-(\d{4})-(\d+)/i);
  const lawType = documentId.startsWith('ordonnance') ? 'Ordonnance' : 'Loi';
  const canonicalRef = lawMatch
    ? `Article ${articleNum}, ${lawType} n. ${lawMatch[1]}-${lawMatch[2]}`
    : `Article ${articleNum}, ${documentTitle}`;
  return {
    canonical_ref: canonicalRef,
    display_text: `Article ${articleNum} de ${documentTitle}`,
    lookup: { tool: 'get_provision', args: { document_id: documentId, section: articleNum } },
  };
}

export async function buildLegalStance(
  db: InstanceType<typeof Database>,
  input: BuildLegalStanceInput,
): Promise<ToolResponse<LegalStanceResult[]>> {
  if (!input.query || input.query.trim().length === 0) {
    return { results: [], _meta: generateResponseMetadata(db, RESEARCH_DISCLAIMER) };
  }

  const limit = Math.min(Math.max(input.limit ?? 5, 1), 20);
  const fetchLimit = limit * 2;
  const queryVariants = buildFtsQueryVariants(sanitizeFtsInput(input.query));

  // Resolve document_id from title if provided
  let resolvedDocId: string | undefined;
  if (input.document_id) {
    const resolved = resolveDocumentId(db, input.document_id);
    resolvedDocId = resolved ?? undefined;
    if (!resolved) {
      return {
        results: [],
        _meta: {
          ...generateResponseMetadata(db, RESEARCH_DISCLAIMER),
          note: `No document found matching "${input.document_id}"`,
        },
      };
    }
  }

  let queryStrategy = 'none';
  for (const ftsQuery of queryVariants) {
    let sql = `
      SELECT
        lp.document_id,
        ld.title as document_title,
        lp.provision_ref,
        lp.section,
        lp.title,
        snippet(provisions_fts, 0, '>>>', '<<<', '...', 48) as snippet,
        bm25(provisions_fts) as relevance
      FROM provisions_fts
      JOIN legal_provisions lp ON lp.id = provisions_fts.rowid
      JOIN legal_documents ld ON ld.id = lp.document_id
      WHERE provisions_fts MATCH ?
    `;
    const params: (string | number)[] = [ftsQuery];

    if (resolvedDocId) {
      sql += ' AND lp.document_id = ?';
      params.push(resolvedDocId);
    }

    sql += ' ORDER BY relevance LIMIT ?';
    params.push(fetchLimit);

    try {
      const rows = db.prepare(sql).all(...params) as RawRow[];
      if (rows.length > 0) {
        queryStrategy = ftsQuery === queryVariants[0] ? 'exact' : 'fallback';
        const deduped = deduplicateResults(rows, limit);
        return {
          results: deduped.map(r => ({ ...r, _citation: buildCitation(r.document_id, r.document_title, r.provision_ref) })),
          _meta: {
            ...generateResponseMetadata(db, RESEARCH_DISCLAIMER),
            ...(queryStrategy === 'fallback' ? { query_strategy: 'broadened' } : {}),
          },
        };
      }
    } catch {
      continue;
    }
  }

  // LIKE fallback — last resort when all FTS5 variants return empty
  {
    const likePattern = buildLikePattern(sanitizeFtsInput(input.query));
    let likeSql = `
      SELECT
        lp.document_id,
        ld.title as document_title,
        lp.provision_ref,
        lp.section,
        lp.title,
        substr(lp.content, 1, 300) as snippet,
        0 as relevance
      FROM legal_provisions lp
      JOIN legal_documents ld ON ld.id = lp.document_id
      WHERE lp.content LIKE ?
    `;
    const likeParams: (string | number)[] = [likePattern];

    if (resolvedDocId) {
      likeSql += ' AND lp.document_id = ?';
      likeParams.push(resolvedDocId);
    }

    likeSql += ' LIMIT ?';
    likeParams.push(fetchLimit);

    try {
      const rows = db.prepare(likeSql).all(...likeParams) as RawRow[];
      if (rows.length > 0) {
        const deduped = deduplicateResults(rows, limit);
        return {
          results: deduped.map(r => ({ ...r, _citation: buildCitation(r.document_id, r.document_title, r.provision_ref) })),
          _meta: {
            ...generateResponseMetadata(db, RESEARCH_DISCLAIMER),
            query_strategy: 'like_fallback',
          },
        };
      }
    } catch {
      // LIKE query failed — fall through to empty return
    }
  }

  return { results: [], _meta: generateResponseMetadata(db, RESEARCH_DISCLAIMER) };
}

/**
 * Deduplicate results by document_title + provision_ref.
 * Duplicate document IDs (numeric vs slug) cause the same provision to appear twice.
 */
function deduplicateResults(rows: RawRow[], limit: number): RawRow[] {
  const seen = new Set<string>();
  const deduped: RawRow[] = [];
  for (const row of rows) {
    const key = `${row.document_title}::${row.provision_ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
    if (deduped.length >= limit) break;
  }
  return deduped;
}
