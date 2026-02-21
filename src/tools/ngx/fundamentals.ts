import { FundamentalRepository, FundamentalMetric } from '../../db/repositories/fundamental-repo.js';

/**
 * Fetches stored financial fundamentals for an NGX-listed company.
 *
 * Queries the local SQLite database for previously extracted data.
 * If no data is found, returns a helpful message suggesting the user
 * look up the company's annual report via disclosures.
 *
 * @param symbol - NGX ticker (e.g. "DANGCEM", "GTCO")
 * @param period - Optional period filter (e.g. "Full Year 2023")
 * @returns Stored fundamentals or guidance message
 */
export async function fetchFundamentals(
    symbol: string,
    period?: string
): Promise<FundamentalMetric[] | { message: string; suggestion: string }> {
    const ticker = symbol.toUpperCase().trim();

    const fundamentals = await FundamentalRepository.getFundamentals(ticker, period);

    if (fundamentals.length === 0) {
        return {
            message: `No financial data found for ${ticker} in the local database.`,
            suggestion: `Use the ngx_metrics tool with "${ticker}" to search for and parse the company's annual report, which will populate the database.`,
        };
    }

    return fundamentals;
}

/**
 * Returns all available reporting periods for a given ticker.
 */
export async function getAvailablePeriods(symbol: string): Promise<string[]> {
    const ticker = symbol.toUpperCase().trim();
    const all = await FundamentalRepository.getFundamentals(ticker);

    const periods = new Set(all.map((f) => f.period));
    return Array.from(periods).sort();
}

/**
 * Computes year-over-year growth rates for key metrics.
 *
 * @param symbol - NGX ticker
 * @param metric - Metric name (e.g. "revenue", "profit_after_tax")
 * @returns Array of { period, value, yoyGrowth } or message if insufficient data
 */
export async function computeGrowthRates(
    symbol: string,
    metric: string
): Promise<
    | Array<{ period: string; value: number; yoy_growth_pct: number | null }>
    | { message: string }
> {
    const ticker = symbol.toUpperCase().trim();
    const all = await FundamentalRepository.getFundamentals(ticker);

    // Filter for the requested metric and sort by period
    const relevant = all
        .filter((f) => f.metric === metric)
        .sort((a, b) => a.period.localeCompare(b.period));

    if (relevant.length === 0) {
        return { message: `No ${metric} data found for ${ticker}.` };
    }

    const results: Array<{ period: string; value: number; yoy_growth_pct: number | null }> = [];

    for (let i = 0; i < relevant.length; i++) {
        const value = parseFloat(relevant[i].value);
        let yoy_growth_pct: number | null = null;

        if (i > 0) {
            const prevValue = parseFloat(relevant[i - 1].value);
            if (prevValue !== 0) {
                yoy_growth_pct = Number((((value - prevValue) / Math.abs(prevValue)) * 100).toFixed(2));
            }
        }

        results.push({
            period: relevant[i].period,
            value,
            yoy_growth_pct,
        });
    }

    return results;
}
