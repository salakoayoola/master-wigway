import { fetchNgxPrices, NgxPrice } from './prices.js';
import { PriceRepository } from '../../db/repositories/price-repo.js';

export * from './prices.js';

/**
 * Modern financial_search implementation for NGX.
 * Uses SQLite as a cache layer with 1-hour shelf life.
 */
export function createFinancialSearch(model: string) {
    const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

    return async (query: string) => {
        let prices: NgxPrice[] = [];

        // Try getting from DB first
        const cached = PriceRepository.getAllLatestPrices();

        const isStale = (cached.length === 0) ||
            (Date.now() - (cached[0]?.timestamp || 0) > CACHE_TTL_MS);

        if (isStale) {
            console.log('NGX Price cache stale or missing. Fetching live data...');
            try {
                prices = await fetchNgxPrices();
                PriceRepository.savePrices(prices);
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
