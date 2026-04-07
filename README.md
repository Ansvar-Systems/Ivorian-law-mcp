# Ivorian Law MCP Server

**The Journal Officiel de Côte d'Ivoire alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Fivorian-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/ivorian-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Ivorian-law-mcp?style=social)](https://github.com/Ansvar-Systems/Ivorian-law-mcp)
[![CI](https://github.com/Ansvar-Systems/Ivorian-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Ivorian-law-mcp/actions/workflows/ci.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](https://github.com/Ansvar-Systems/Ivorian-law-mcp)
[![Provisions](https://img.shields.io/badge/provisions-50-blue)](https://github.com/Ansvar-Systems/Ivorian-law-mcp)

Query **11 Ivorian statutes** -- from the Loi sur la Protection des Données Personnelles and Code Pénal to the Code du Travail, Code des Investissements, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Côte d'Ivoire legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Ivorian legal research means navigating jurisconsulte.ci, biblio.cndj.ci (Centre National de Documentation Juridique), and journalofficiel.gouv.ci for official gazette publications in French. Whether you're:
- A **lawyer** validating citations in a brief or contract
- A **compliance officer** checking obligations under Loi n°2013-450 on Personal Data Protection
- A **legal tech developer** building tools on Ivorian law
- A **researcher** tracing provisions across Ivorian statutes

...you shouldn't need dozens of browser tabs and manual PDF cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Ivorian law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://mcp.ansvar.eu/law-ci/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add ivorian-law --transport http https://mcp.ansvar.eu/law-ci/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ivorian-law": {
      "type": "url",
      "url": "https://mcp.ansvar.eu/law-ci/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "ivorian-law": {
      "type": "http",
      "url": "https://mcp.ansvar.eu/law-ci/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/ivorian-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ivorian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/ivorian-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "ivorian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/ivorian-law-mcp"]
    }
  }
}
```

---

## Example Queries

Once connected, just ask naturally:

- *"Rechercher les dispositions sur la protection des données personnelles dans la Loi n°2013-450"*
- *"Que dit le Code Pénal ivoirien sur la cybercriminalité?"*
- *"Trouver les droits des travailleurs dans le Code du Travail de Côte d'Ivoire"*
- *"Quelles sont les obligations de l'employeur selon le Code du Travail ivoirien?"*
- *"Rechercher les dispositions sur les investissements étrangers dans le Code des Investissements"*
- *"La Loi n°2013-450 sur la protection des données est-elle toujours en vigueur?"*
- *"Valider la citation 'Article 5, Loi n°2013-450 du 19 juin 2013'"*
- *"Construire une position juridique sur la conformité en matière de protection des données en Côte d'Ivoire"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Statutes** | 11 statutes | Key Ivorian legislation |
| **Provisions** | 50 sections | Full-text searchable with FTS5 |
| **Database Size** | ~1.4 MB | Optimized SQLite, portable |
| **Data Sources** | biblio.cndj.ci / jurisconsulte.ci | Centre National de Documentation Juridique |
| **Language** | French | Official statute language of Côte d'Ivoire |
| **Freshness Checks** | Automated | Drift detection against official sources |

**Verified data only** -- every citation is validated against official sources (CNDJ, Journal Officiel). Zero LLM-generated content.

---

## See It In Action

### Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from biblio.cndj.ci and jurisconsulte.ci official publications
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains statute text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by statute name and article number
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
biblio.cndj.ci / jurisconsulte.ci --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                                        ^                        ^
                                 Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Browse Journal Officiel by date | Search by plain French: *"protection des données personnelles"* |
| Navigate multi-article statutes manually | Get the exact provision with context |
| Manual cross-referencing between codes | `build_legal_stance` aggregates across sources |
| "Est-ce que cette loi est encore en vigueur?" -- check manually | `check_currency` tool -- answer in seconds |
| Find international alignment -- dig manually | `get_eu_basis` -- linked frameworks instantly |
| No API, no integration | MCP protocol -- AI-native |

**Traditional:** Browse CNDJ archives --> Locate statute --> Navigate articles --> Cross-reference ECOWAS frameworks --> Repeat

**This MCP:** *"Quelles sont les exigences de conformité en matière de protection des données personnelles en Côte d'Ivoire?"* --> Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 50 provisions with BM25 ranking. Full French-language support |
| `get_provision` | Retrieve specific provision by statute name and article number |
| `validate_citation` | Validate citation against database -- zero-hallucination check |
| `build_legal_stance` | Aggregate citations from multiple statutes for a legal topic |
| `format_citation` | Format citations per Ivorian legal conventions (full/short/pinpoint) |
| `check_currency` | Check if a statute is in force, amended, or repealed |
| `list_sources` | List all available statutes with metadata and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### International Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get international frameworks that an Ivorian statute aligns with |
| `get_ivorian_implementations` | Find Ivorian laws aligning with a specific international framework |
| `search_eu_implementations` | Search international documents with Ivorian alignment counts |
| `get_provision_eu_basis` | Get international law references for a specific provision |
| `validate_eu_compliance` | Check alignment status of Ivorian statutes against international standards |

---

## International Law Alignment

Côte d'Ivoire is not an EU member state, but Ivorian legislation aligns with key international frameworks:

- **Loi n°2013-450 sur la Protection des Données Personnelles** draws on the ECOWAS Supplementary Act on Personal Data Protection (A/SA.1/01/10) and aligns with core GDPR principles -- consent, purpose limitation, data subject rights
- **ECOWAS membership** means Ivorian commercial and trade law aligns with the ECOWAS Treaty framework
- **African Union membership** connects Ivorian law to the AU Convention on Cyber Security and Personal Data Protection (Malabo Convention)
- **La Francophonie** membership creates shared legal principles with French-speaking jurisdictions including France and EU member states
- **OHADA membership** -- Côte d'Ivoire is a member of the Organisation pour l'Harmonisation en Afrique du Droit des Affaires, giving its commercial law a regionally harmonised framework

The international alignment tools allow you to explore these relationships -- checking which Ivorian provisions correspond to international standards, and vice versa.

> **Note:** Côte d'Ivoire is not an EU member state. International cross-references reflect alignment and shared principles, not direct transposition. Verify compliance obligations against the specific applicable framework for your jurisdiction.

---

## Data Sources & Freshness

All content is sourced from authoritative Ivorian legal databases:

- **[biblio.cndj.ci](https://biblio.cndj.ci/)** -- Centre National de Documentation Juridique de Côte d'Ivoire
- **[jurisconsulte.ci](https://jurisconsulte.ci/)** -- Ivorian legal database
- **[journalofficiel.gouv.ci](https://www.journalofficiel.gouv.ci/)** -- Journal Officiel de la République de Côte d'Ivoire

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | Centre National de Documentation Juridique (CNDJ) |
| **Retrieval method** | Official statute downloads |
| **Language** | French (official language of Côte d'Ivoire) |
| **Coverage** | 11 statutes, 50 provisions |
| **Database size** | ~1.4 MB |

### Automated Freshness Checks

A GitHub Actions workflow monitors all data sources:

| Check | Method |
|-------|--------|
| **Statute amendments** | Drift detection against known provision anchors |
| **New statutes** | Comparison against CNDJ index |
| **Repealed statutes** | Status change detection |

**Verified data only** -- every citation is validated against official sources. Zero LLM-generated content.

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official Ivorian legal publications (CNDJ, Journal Officiel). However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is not included** -- do not rely solely on this for case law research
> - **Verify critical citations** against primary sources for court filings
> - **International cross-references** reflect alignment relationships, not direct transposition
> - **Coverage is selective** -- priority statutes only; verify completeness for your specific legal question

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [SECURITY.md](SECURITY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment. Consult the **Ordre des Avocats de Côte d'Ivoire** guidance on client confidentiality obligations.

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/Ivorian-law-mcp
cd Ivorian-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest           # Ingest statutes from CNDJ sources
npm run build:db         # Rebuild SQLite database
npm run drift:detect     # Run drift detection against anchors
npm run check-updates    # Check for amendments and new statutes
npm run census           # Generate coverage census
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~1.4 MB (efficient, portable)
- **Reliability:** 100% ingestion success rate

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/sanctions-mcp](https://github.com/Ansvar-Systems/Sanctions-MCP)
**Offline-capable sanctions screening** -- OFAC, EU, UN sanctions lists. `pip install ansvar-sanctions-mcp`

**108 national law MCPs** covering Côte d'Ivoire, Senegal, Nigeria, Ghana, Cameroon, France, Belgium, Morocco, Tunisia, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Statute coverage expansion (additional codes and laws from Journal Officiel)
- Court case law (Cour Suprême decisions)
- Historical statute versions and amendment tracking
- OHADA uniform acts integration

---

## Roadmap

- [x] Core statute database with FTS5 search
- [x] Full corpus ingestion (11 statutes, 50 provisions)
- [x] International law alignment tools (ECOWAS, AU, OHADA)
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [ ] Statute coverage expansion (additional codes)
- [ ] Court case law (Cour Suprême)
- [ ] Historical statute versions (amendment tracking)
- [ ] OHADA uniform acts integration

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{ivorian_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Ivorian Law MCP Server: AI-Powered Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/Ivorian-law-mcp},
  note = {11 Ivorian statutes with 50 provisions, Côte d'Ivoire}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Government of Côte d'Ivoire / CNDJ (public domain)
- **International Metadata:** Public domain

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server started as our internal reference tool for West African and Francophone legal research -- turns out everyone building compliance tools for the ECOWAS region has the same research frustrations.

So we're open-sourcing it. Navigating Ivorian law across Journal Officiel publications shouldn't require a law degree.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
