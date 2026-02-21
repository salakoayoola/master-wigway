import { fetchNgxPrices, ScrapedNgxPrice } from './prices';
import { PriceRepository, NgxPrice } from '../../db/repositories/price-repo.js';
import { searchNgxDisclosures } from './disclosure-scraper';
import { extractTextFromPdf } from './pdf-parser';
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
 * Fetches metrics from DB or triggers the parsing pipeline.
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

        return {
            symbol,
            message: `Found annual report from ${annualReport.date}. Extraction will begin shortly.`,
            reportUrl: annualReport.link,
            title: annualReport.title,
            instruction: `Extract metrics from this PDF: ${annualReport.link}`
        };
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
