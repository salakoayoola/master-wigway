import { fetchNgxPrices, ScrapedNgxPrice } from './prices';
import { PriceRepository, NgxPrice } from '../../db/repositories/price-repo.js';
import { searchNgxDisclosures } from './disclosure-scraper';
import { extractTextFromPdf, extractFinancialsWithLlm } from './pdf-parser';
import { FundamentalRepository } from '../../db/repositories/fundamental-repo.js';

export * from './prices';
export * from './disclosure-scraper';
export * from './pdf-parser';

/**
 * Modern financial_search implementation for NGX.
 * Uses SQLite as a cache layer with 1-hour shelf life.
 */
export function createFinancialSearch(model: string) {
    const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

    return async (query: string) => {
        let prices: NgxPrice[] = [];

        // Try getting from DB first
        const cached = await PriceRepository.getAllLatestPrices();

        const isStale = (cached.length === 0) ||
            (Date.now() - (cached[0]?.timestamp || 0) > CACHE_TTL_MS);

        if (isStale) {
            console.log('NGX Price cache stale or missing. Fetching live data...');
            try {
                const scraped = await fetchNgxPrices();
                prices = scraped.map(s => ({
                    symbol: s.symbol,
                    open: s.open,
                    high: s.high,
                    low: s.low,
                    close: s.close,
                    price_change: s.change,
                    timestamp: Date.now()
                }));
                await PriceRepository.savePrices(prices);
            } catch (error) {
                console.error('Failed to fetch live prices, falling back to cache if available:', error);
                if (cached.length > 0) {
                    prices = cached;
                } else {
                    throw error;
                }
            }
        } else {
            console.log('Using cached NGX prices from local storage.');
            prices = cached;
        }

        // Simple filter for the query if it's a ticker
        const tickerMatch = query.toUpperCase().match(/\b[A-Z]{3,10}\b/g);
        if (tickerMatch) {
            const results = prices.filter(p => tickerMatch.includes(p.symbol));
            if (results.length > 0) return results;
        }

        return prices;
    };
}

/**
 * Fetches metrics from DB or triggers the full parsing pipeline:
 *   1. Search disclosures for annual report
 *   2. Download and extract PDF text
 *   3. Use LLM to extract structured financials
 *   4. Store results in local DB
 *   5. Return the extracted metrics
 */
export function createFinancialMetrics(model: string) {
    return async (query: string) => {
        const symbol = query.toUpperCase().trim();

        // Check DB first
        const cached = await FundamentalRepository.getFundamentals(symbol);
        if (cached.length > 0) {
            return cached;
        }

        console.log(`No metrics found for ${symbol} in DB. Searching disclosures...`);

        // Find latest annual report
        const disclosures = await searchNgxDisclosures(symbol);
        const annualReport = disclosures.find(d =>
            d.title.toUpperCase().includes('ANNUAL REPORT') ||
            d.title.toUpperCase().includes('AUDITED FINANCIAL')
        );

        if (!annualReport) {
            return {
                message: `Could not find an annual report for ${symbol} in recent disclosures.`,
                disclosures: disclosures.slice(0, 3)
            };
        }

        // Full extraction pipeline
        console.log(`Found annual report: "${annualReport.title}" (${annualReport.date}). Extracting...`);

        try {
            // Step 1: Extract text from PDF
            const { text, warning } = await extractTextFromPdf(annualReport.link);

            if (warning) {
                console.warn(`PDF warning for ${symbol}: ${warning}`);
            }

            if (!text || text.length < 50) {
                return {
                    symbol,
                    message: `Annual report PDF for ${symbol} could not be parsed (possibly a scanned document).`,
                    warning,
                    reportUrl: annualReport.link,
                };
            }

            // Step 2: LLM extracts structured metrics
            const extraction = await extractFinancialsWithLlm(text, model);

            // Step 3: Store in DB
            const metricsToSave = [];
            for (const period of extraction.periods) {
                const periodLabel = period.reporting_period;
                const entries = Object.entries(period).filter(
                    ([key]) => key !== 'reporting_period'
                );

                for (const [metric, value] of entries) {
                    if (value !== null && value !== undefined) {
                        metricsToSave.push({
                            symbol,
                            metric,
                            value: String(value),
                            period: periodLabel,
                        });
                    }
                }
            }

            if (metricsToSave.length > 0) {
                await FundamentalRepository.saveFundamentals(metricsToSave);
                console.log(`Saved ${metricsToSave.length} metrics for ${symbol} to DB.`);
            }

            return {
                symbol,
                company: extraction.company_name,
                ticker: extraction.ticker,
                periods: extraction.periods,
                source: annualReport.link,
                date: annualReport.date,
            };
        } catch (error) {
            console.error(`Failed to extract metrics for ${symbol}:`, error);
            return {
                symbol,
                message: `Found annual report but failed to extract metrics. Error: ${error instanceof Error ? error.message : String(error)}`,
                reportUrl: annualReport.link,
                title: annualReport.title,
            };
        }
    };
}

export function createReadFilings(model: string) {
    return async (query: string) => {
        const symbol = query.toUpperCase().trim();
        const disclosures = await searchNgxDisclosures(symbol);
        return disclosures;
    };
}

// These will be implemented in subsequent slices
export * from './fundamentals';
export * from './news';
export * from './ratios';
export * from './company-profile';
