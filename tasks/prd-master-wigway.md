[PRD]
# PRD: Master Wigway — NGX Financial Research Agent

## Overview

Master Wigway is a fork of [virattt/dexter](https://github.com/virattt/dexter) — an autonomous financial research agent — adapted for the **Nigerian Stock Exchange (NGX)**. Named in tribute to the late Herbert Wigwe, pioneering Nigerian bank chief.

The project strips all US-specific financial tools and replaces them with NGX equivalents: web scraping for prices and disclosures, PDF annual report parsing with hybrid structured/LLM extraction, and news analysis via web search. The agent core (task planning, self-reflection, tool execution), CLI, WhatsApp gateway, and search tools remain unchanged.

**Target user:** Single user (personal investment research tool).

## Goals

- Replace all US financial data tools with NGX-specific scrapers and parsers
- Enable autonomous research on any NGX-listed equity using free data sources only
- Parse uploaded PDF annual reports into a structured local database for cross-year comparison
- Adapt the DCF valuation skill for Nigerian market risk parameters (FGN bond yields, Naira-denominated)
- Build an NGX-focused evaluation dataset to benchmark agent accuracy
- Maintain Dexter's agent architecture (task planning, self-reflection, loop detection)

## Quality Gates

These commands must pass for every user story:
- `bun typecheck` — Type checking
- `bun lint` — Linting

For gateway/UI stories, also include:
- Verify WhatsApp gateway in browser using dev-browser skill

## User Stories

### US-001: Project Scaffolding & Cleanup
**Description:** As a developer, I want to fork Dexter and strip all US-specific finance tools so that I have a clean codebase ready for NGX tools.

**Acceptance Criteria:**
- [ ] Repository forked from virattt/dexter into salakoayoola/master-wigway
- [ ] All files in `src/tools/finance/` removed
- [ ] All files in `src/tools/descriptions/financial-*` and `read-filings.ts` removed
- [ ] New `src/tools/ngx/` directory created with `index.ts` barrel export
- [ ] New `src/tools/descriptions/ngx-*` directory structure created
- [ ] Tool registry (`src/tools/registry.ts`) updated to reference NGX tools instead of finance tools
- [ ] `package.json` name field updated to `master-wigway`
- [ ] Project builds successfully with `bun install && bun typecheck`
- [ ] Existing tests still pass where applicable

---

### US-002: NGX Price Scraper Tool
**Description:** As a researcher, I want to get current and recent prices for any NGX-listed stock so that I can track market movements.

**Acceptance Criteria:**
- [ ] `src/tools/ngx/prices.ts` scrapes equities price list from `ngxgroup.com/exchange/data/equities-price-list/`
- [ ] Returns structured data: ticker, company name, open, high, low, close, change, change%, volume, value
- [ ] Supports filtering by ticker symbol (e.g., "DANGCEM", "GTCO", "ZENITHBANK")
- [ ] Daily results cached to `.master-wigway/cache/prices/YYYY-MM-DD.json`
- [ ] Returns cached data if NGX market is closed (weekends, holidays)
- [ ] Tool description in `src/tools/descriptions/ngx-prices.ts` clearly explains parameters
- [ ] Handles scraping failures gracefully with retry + fallback to cache

---

### US-003: Corporate Disclosures Scraper
**Description:** As a researcher, I want to browse corporate disclosures from NGX so that I can find annual reports, dividend notices, and interim results.

**Acceptance Criteria:**
- [ ] `src/tools/ngx/disclosures.ts` scrapes disclosure listings from `ngxgroup.com/exchange/data/corporate-disclosures/`
- [ ] Supports filtering by company name, disclosure type (annual report, interim, dividend, board decision), and date range
- [ ] Returns: company, disclosure type, date, title, PDF download URL
- [ ] Handles pagination if disclosure lists span multiple pages
- [ ] Tool description in `src/tools/descriptions/ngx-disclosures.ts` explains filters

---

### US-004: PDF Annual Report Parser (Hybrid Extraction)
**Description:** As a researcher, I want to upload PDF annual reports and have key financial metrics extracted into a local database so that I can query and compare across years.

**Acceptance Criteria:**
- [ ] `src/tools/ngx/pdf-parser.ts` accepts a local PDF file path
- [ ] Uses `pdf-parse` (or `pdfjs-dist`) to extract text from PDF
- [ ] LLM extracts structured metrics: revenue, gross profit, operating profit, PAT, EPS, DPS, total assets, total equity, NAV, shares outstanding
- [ ] Extracted metrics stored in SQLite DB at `~/.master-wigway/financials.db` using `bun:sqlite`
- [ ] DB schema includes tables: `companies` (ticker, name, sector), `annual_financials` (ticker, year, metrics), `quarterly_financials` (ticker, quarter, year, metrics)
- [ ] For qualitative questions (management commentary, risks, strategy), LLM reads raw PDF text directly
- [ ] Handles multi-year reports (extracts data for each reported year)
- [ ] Graceful error if PDF cannot be parsed (corrupt file, scanned image)

---

### US-005: Fundamentals Query Tool
**Description:** As a researcher, I want to query stored financial data from the local database so that I can compare company performance across years.

**Acceptance Criteria:**
- [ ] `src/tools/ngx/fundamentals.ts` queries the local SQLite DB
- [ ] Supports queries: get financials by ticker + year, list all years available for a ticker, get latest financials
- [ ] Can compute derived metrics: year-over-year growth rates for revenue, profit, EPS
- [ ] Returns clear message if ticker has no data in DB (suggests uploading annual report)
- [ ] Tool description in `src/tools/descriptions/ngx-fundamentals.ts` explains available queries

---

### US-006: NGX News & Analysis Tool
**Description:** As a researcher, I want to search for recent news about NGX stocks so that I can factor market sentiment into my analysis.

**Acceptance Criteria:**
- [ ] `src/tools/ngx/news.ts` uses existing web search tools (Exa/Tavily) with NGX-optimised query templates
- [ ] Pre-built query templates target: Nairametrics, StocksNG/StocksWatch, BusinessDay, Proshare
- [ ] Supports search by: company name/ticker, topic (earnings, dividends, M&A, regulation), date range
- [ ] Returns: title, source, date, snippet, URL
- [ ] Deduplicates results from multiple search providers
- [ ] Tool description explains search capabilities and source coverage

---

### US-007: Financial Ratios Calculator
**Description:** As a researcher, I want automatically computed financial ratios so that I can quickly assess a stock's valuation and health.

**Acceptance Criteria:**
- [ ] `src/tools/ngx/ratios.ts` computes ratios from local DB fundamentals + scraped prices
- [ ] Supported ratios: P/E, P/B, dividend yield, ROE, ROA, debt-to-equity, current ratio, EPS growth, revenue growth
- [ ] Computes market cap from shares outstanding × current price
- [ ] Returns clear explanation of each ratio alongside the value
- [ ] Handles missing data gracefully (e.g., "P/E unavailable — no earnings data for this year")
- [ ] Tool description lists all available ratios with definitions

---

### US-008: DCF Valuation Skill (Nigerian Adaptation)
**Description:** As a researcher, I want to run DCF valuations on NGX stocks using Nigerian market parameters so that I can estimate intrinsic value.

**Acceptance Criteria:**
- [ ] `src/skills/dcf/SKILL.md` updated with Nigerian-specific instructions
- [ ] Risk-free rate defaults to Nigerian 10-year FGN bond yield (~18-19%)
- [ ] Equity risk premium adjusted for Nigerian market risk (~5-7%)
- [ ] Terminal growth rate capped at long-term Nigerian GDP growth (~3-4%)
- [ ] `src/skills/dcf/sector-wacc.md` rebuilt with NGX sectors: Banking, Oil & Gas, Consumer Goods, Industrial Goods, Insurance, Agriculture, Healthcare, ICT, Services, Conglomerates
- [ ] All projections denominated in Naira (₦)
- [ ] Skill references fundamentals from local DB and current price from scraper

---

### US-009: Agent Prompts & Identity Update
**Description:** As a researcher, I want the agent to understand it specialises in NGX equities so that it gives contextually accurate responses.

**Acceptance Criteria:**
- [ ] `src/agent/prompts.ts` system prompt updated to reference NGX instead of US markets
- [ ] Nigerian financial terminology used (PAT instead of net income, DPS conventions)
- [ ] Currency references changed to Naira (₦)
- [ ] Market hours noted as 10:00–14:30 WAT, Monday–Friday
- [ ] Tool descriptions reference Nigerian data sources (ngxgroup.com, Nairametrics, etc.)
- [ ] Agent intro (`src/components/intro.ts`) updated with Master Wigway branding
- [ ] Agent name in CLI updated from "Dexter" to "Wigway"

---

### US-010: NGX Evaluation Dataset
**Description:** As a developer, I want an evaluation dataset of NGX financial questions so that I can benchmark the agent's accuracy.

**Acceptance Criteria:**
- [ ] `src/evals/dataset/ngx_agent.csv` created with ≥50 question-answer pairs
- [ ] Questions cover: stock prices, financial metrics, comparisons, valuations, news, macro context
- [ ] Answers sourced from verifiable NGX data (public filings, published results)
- [ ] Companies covered include major NGX stocks: DANGCEM, GTCO, ZENITHBANK, MTNN, BUACEMENT, NESTLE, AIRTELAFRI, ACCESSCORP, FBNH, SEPLAT
- [ ] Original US eval dataset (`finance_agent.csv`) removed
- [ ] Eval runner (`src/evals/run.ts`) works with new dataset without modification (same CSV schema)

## Functional Requirements

- FR-1: All NGX tools must implement Dexter's existing tool interface (`ToolDefinition` type) for seamless agent integration
- FR-2: The price scraper must handle NGX site HTML structure changes by failing loudly with descriptive error messages
- FR-3: The PDF parser must validate extracted metrics against reasonable ranges (e.g., revenue > 0) before storing in DB
- FR-4: The local SQLite database must be created automatically on first use (no manual setup)
- FR-5: All scraped data must include timestamps indicating when it was fetched
- FR-6: The agent must never hallucinate financial data — if data is unavailable, it must say so explicitly
- FR-7: Cache files must be stored under `~/.master-wigway/` to avoid polluting the project directory

## Non-Goals (Out of Scope)

- Real-time streaming price data (EOD prices are sufficient)
- Paid data provider integrations (free sources only for v1)
- Multi-user access or authentication
- Portfolio tracking or trade execution
- Coverage of non-equity instruments (bonds, ETFs, derivatives)
- Automated PDF downloading from NGX (user uploads manually for now)
- Mobile app or web frontend (CLI + WhatsApp only)

## Technical Considerations

- **Bun runtime** — entire project uses Bun, SQLite available via `bun:sqlite` (zero extra dependencies)
- **Scraping fragility** — NGX website structure may change; scrapers should use resilient selectors and fail loudly
- **PDF quality** — some annual reports may be scanned images (not text-based); the parser should detect and warn
- **Rate limiting** — be respectful of ngxgroup.com; cache aggressively, don't scrape more than once per day for prices
- **LLM costs** — PDF extraction uses LLM calls; consider using a cheaper model (Flash/mini) for structured extraction

## Success Metrics

- Agent correctly answers ≥70% of NGX eval dataset questions
- Price scraper returns accurate EOD data for all ~150 listed equities
- PDF parser successfully extracts key metrics from ≥90% of standard NGX annual reports
- DCF valuation produces reasonable intrinsic values for blue-chip NGX stocks
- Full research workflow (price check → fundamentals → news → valuation) completes in under 3 minutes

## Open Questions

- Should we add an OCR layer (e.g., Tesseract) for scanned PDF annual reports, or is text-based PDF sufficient for v1?
- How frequently does the NGX equities price list page structure change? May need a monitoring/alert system.
- Should the agent auto-download annual report PDFs from NGX disclosures, or is manual upload preferred for v1?

[/PRD]
