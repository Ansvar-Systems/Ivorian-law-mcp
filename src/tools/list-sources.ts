/**
 * list_sources — Return provenance metadata for all data sources.
 */

import type Database from '@ansvar/mcp-sqlite';
import { readDbMetadata } from '../capabilities.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface SourceInfo {
  name: string;
  authority: string;
  url: string;
  license: string;
  coverage: string;
  languages: string[];
}

export interface ListSourcesResult {
  sources: SourceInfo[];
  database: {
    tier: string;
    schema_version: string;
    built_at?: string;
    document_count: number;
    provision_count: number;
  };
}

function safeCount(db: InstanceType<typeof Database>, sql: string): number {
  try {
    const row = db.prepare(sql).get() as { count: number } | undefined;
    return row ? Number(row.count) : 0;
  } catch {
    return 0;
  }
}

export async function listSources(
  db: InstanceType<typeof Database>,
): Promise<ToolResponse<ListSourcesResult>> {
  const meta = readDbMetadata(db);

  return {
    results: {
      sources: [
        {
          name: 'Bibliothèque Juridique Numérique — CNDJ',
          authority: 'Centre National de Documentation Juridique (CNDJ)',
          url: 'https://biblio.cndj.ci',
          license: 'Government Open Data',
          coverage:
            'Lois et ordonnances de Côte d\'Ivoire (1 942 textes primaires recensés), ' +
            'incluant la Constitution du 8 novembre 2016, le code pénal, le code du travail, ' +
            'la loi sur la protection des données personnelles (Loi n. 2013-450), ' +
            'la loi sur la cybercriminalité (Loi n. 2013-451), et les transactions électroniques. ' +
            'Texte intégral disponible pour 11 lois clés ; métadonnées pour 1 931 autres.',
          languages: ['fr'],
        },
      ],
      database: {
        tier: meta.tier,
        schema_version: meta.schema_version,
        built_at: meta.built_at,
        document_count: safeCount(db, 'SELECT COUNT(*) as count FROM legal_documents'),
        provision_count: safeCount(db, 'SELECT COUNT(*) as count FROM legal_provisions'),
      },
    },
    _meta: generateResponseMetadata(db),
  };
}
