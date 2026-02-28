# Coverage Index -- Cote d'Ivoire Law MCP

> Auto-generated from census data. Do not edit manually.
> Generated: 2026-02-28

## Source

| Field | Value |
|-------|-------|
| Authority | CNDJ (Centre National de Documentation Juridique) |
| Portal | [biblio.cndj.ci](https://biblio.cndj.ci) |
| License | Government Publication |
| Census date | 2026-02-28 |
| Census method | Automated scraping of biblio.cndj.ci search listings |

## Summary

| Metric | Count |
|--------|-------|
| Total primary laws enumerated | 1,942 |
| -- LOI (laws) | 1,414 |
| -- ORDONNANCE (ordinances) | 504 |
| -- Constitution | 1 |
| -- Traite (treaty) | 1 |
| -- Decret (decree) | 1 |
| -- Other (curated) | 21 |
| Laws with full provisions | 11 |
| Auth-required (metadata only) | 1,917 |
| Provisions extracted | 50 |
| Definitions extracted | 11 |
| Documents in database | 1,942 |
| **Provision coverage** | **0.6% (11/1,942)** |
| **Census coverage** | **100% of LOI + ORDONNANCE** |

## Census Completeness

The census enumerates **100% of primary legislation** (LOI and ORDONNANCE)
from the CNDJ digital library. All 1,708 LOI and 587 ORDONNANCE entries
were scraped from public search listing pages on biblio.cndj.ci.

## Full-Text Access Barrier

The CNDJ digital library (biblio.cndj.ci) requires **authenticated login**
to access the full text of individual laws. The search listing pages are
publicly accessible and provide:
- Law title (complete)
- Law number (identifier)
- Signature date
- Journal officiel reference

This metadata has been captured for all 1,942 laws and loaded into the
database as document entries (searchable by title).

**Full provision text** is available for 11 key laws that were manually
curated from publicly accessible sources.

## Laws with Full Provisions (11)

| Title | Provisions | Definitions |
|-------|-----------|-------------|
| Constitution de la Republique de Cote d'Ivoire du 8 novembre 2016 | 4 | 0 |
| Loi n. 2013-450 du 19 juin 2013 relative a la protection des donnees a caractere personnel | 11 | 4 |
| Loi n. 2013-451 du 19 juin 2013 relative a la lutte contre la cybercriminalite | 9 | 2 |
| Loi n. 2013-546 du 30 juillet 2013 relative aux transactions electroniques | 5 | 1 |
| Loi n. 2014-138 du 24 mars 2014 portant Code minier | 3 | 0 |
| Loi n. 2015-532 du 20 juillet 2015 portant Code du Travail | 2 | 0 |
| Loi n. 2016-412 du 15 juin 2016 relative a la consommation | 3 | 0 |
| Loi n. 2016-555 du 26 juillet 2016 relative au droit d'auteur et aux droits voisins | 3 | 1 |
| Loi n. 2016-992 du 14 novembre 2016 relative a la lutte contre le blanchiment de capitaux | 3 | 1 |
| Loi n. 2019-574 du 26 juin 2019 portant Code penal | 3 | 0 |
| Ordonnance n. 2012-293 du 21 mars 2012 relative aux telecommunications et aux TIC | 4 | 2 |

## Scope: Primary Legislation vs. Full Corpus

The CNDJ database contains **29,455 total entries** across all text types:
- LOI: 1,708
- ORDONNANCE: 587
- DECRET: 16,665
- ARRETE: 8,696
- ARRETE INTERMINISTERIEL: 599
- Other types (decisions, circulaires, etc.): ~1,200

This MCP covers **primary legislation** (LOI + ORDONNANCE = 2,295 entries).
Secondary legislation (decrets, arretes) adds ~25,960 more entries but is
excluded from the current scope.

## Year Distribution (Top 10)

| Year | Laws |
|------|------|
| 2020 | 81 |
| 1960 | 63 |
| 2015 | 57 |
| 1959 | 57 |
| 1962 | 57 |
| 2014 | 55 |
| 2023 | 54 |
| 2018 | 50 |
| 2019 | 50 |
| 2000 | 48 |

## Path to Full Provision Coverage

To achieve full provision-level coverage, one of these approaches is needed:

1. **CNDJ subscription** -- Obtain an institutional account for biblio.cndj.ci
   to access full text of all 1,942 laws. Cost unknown (contact CNDJ).

2. **Journal officiel scraping** -- The Secretariat General du Gouvernement
   (sgg.gouv.ci) publishes the Journal officiel. Access currently redirects
   to a different domain.

3. **VPN-assisted scraping** -- Some content may be accessible through
   the VPN ingestion pipeline if geo-blocking is the barrier.

4. **PDF collection** -- Sites like droit-afrique.com host PDFs of major
   Ivorian laws but block automated access (HTTP 403).

5. **Runtime download** -- Strategy B deployment with on-demand text
   retrieval from authenticated CNDJ sessions.
