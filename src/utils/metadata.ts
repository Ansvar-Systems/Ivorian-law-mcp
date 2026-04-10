/**
 * Response metadata utilities for Ivory Coast Law MCP.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface ResponseMeta {
  data_source: string;
  jurisdiction: string;
  disclaimer: string;
  data_age?: string;
  copyright: string;
  freshness?: string;
  note?: string;
  query_strategy?: string;
}

export interface ToolResponse<T> {
  results: T;
  _meta: ResponseMeta;
}

export function generateResponseMetadata(
  db: InstanceType<typeof Database>,
  disclaimerOverride?: string,
): ResponseMeta {
  let freshness: string | undefined;
  let data_age: string | undefined;
  try {
    const row = db.prepare(
      "SELECT value FROM db_metadata WHERE key = 'built_at'"
    ).get() as { value: string } | undefined;
    if (row) {
      freshness = row.value;
      // Extract YYYY-MM-DD for data_age
      const dateMatch = row.value.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) data_age = dateMatch[1];
    }
  } catch {
    // Ignore
  }

  return {
    data_source: 'Centre National de Documentation Juridique (CNDJ) — biblio.cndj.ci',
    jurisdiction: 'CI',
    disclaimer:
      disclaimerOverride ??
      'This data is sourced from the Centre National de Documentation Juridique (CNDJ) under Government Open Data principles. ' +
      'The authoritative versions are in French as published in the Journal Officiel de Côte d\'Ivoire. ' +
      'Always verify with the official CNDJ portal (biblio.cndj.ci).',
    data_age,
    copyright: '© Gouvernement de la République de Côte d\'Ivoire. Données publiées sous principes Open Data gouvernemental.',
    freshness,
  };
}
