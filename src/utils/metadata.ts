/**
 * Response metadata utilities for Ivory Coast Law MCP.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface ResponseMetadata {
  data_source: string;
  jurisdiction: string;
  disclaimer: string;
  freshness?: string;
  note?: string;
  query_strategy?: string;
}

export interface ToolResponse<T> {
  results: T;
  _metadata: ResponseMetadata;
  _citation?: import('./citation.js').CitationMetadata;
}

export function generateResponseMetadata(
  db: InstanceType<typeof Database>,
): ResponseMetadata {
  let freshness: string | undefined;
  try {
    const row = db.prepare(
      "SELECT value FROM db_metadata WHERE key = 'built_at'"
    ).get() as { value: string } | undefined;
    if (row) freshness = row.value;
  } catch {
    // Ignore
  }

  return {
    data_source: 'JuriAfrique Côte d\'Ivoire (juriafrica.com/civ) — Centre National de Documentation Juridique (CNDJ)',
    jurisdiction: 'CI',
    disclaimer:
      'This data is sourced from the Centre National de Documentation Juridique (CNDJ) under Government Open Data principles. ' +
      'The authoritative versions are in French as published in the Journal Officiel de Côte d\'Ivoire. ' +
      'Always verify with the official CNDJ portal (cndj.ci) or juriafrica.com/civ.',
    freshness,
  };
}
