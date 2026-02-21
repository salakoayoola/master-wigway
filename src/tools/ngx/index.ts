import { fetchNgxPrices } from './prices.js';

export * from './prices.js';

/**
 * Modern financial_search implementation for NGX.
 * Wraps the price scraper for now.
 */
export function createFinancialSearch(model: string) {
    return async (query: string) => {
        const prices = await fetchNgxPrices();

        // Simple filter for the query if it's a ticker
        const tickerMatch = query.toUpperCase().match(/\b[A-Z]{3,10}\b/g);
        if (tickerMatch) {
            const results = prices.filter(p => tickerMatch.includes(p.symbol));
            if (results.length > 0) return results;
        }

        return prices;
    };
}

export function createFinancialMetrics(model: string) {
    return async (query: string) => {
        return { message: "NGX Metrics tool is currently under construction. Use ngx_search for prices." };
    };
}

export function createReadFilings(model: string) {
    return async (query: string) => {
        return { message: "NGX Disclosure tool is currently under construction. Please visit ngxgroup.com/exchange/data/company-disclosures/" };
    };
}

// These will be implemented in subsequent slices
export * from './pdf-parser.js';
export * from './fundamentals.js';
export * from './news.js';
export * from './ratios.js';
export * from './company-profile.js';
