import { PriceRepository } from '../../db/repositories/price-repo.js';
import { FundamentalRepository } from '../../db/repositories/fundamental-repo.js';

export interface RatioResult {
    ratio: string;
    value: number | null;
    description: string;
    note?: string;
}

/**
 * Computes key financial ratios for an NGX-listed company.
 *
 * Combines live/cached price data from the scraper with stored
 * fundamental data from the local SQLite database.
 *
 * @param symbol - NGX ticker (e.g. "DANGCEM", "GTCO")
 * @param period - Optional period filter for fundamentals
 * @returns Array of computed ratios or a guidance message
 */
export async function fetchRatios(
    symbol: string,
    period?: string
): Promise<RatioResult[] | { message: string; suggestion: string }> {
    const ticker = symbol.toUpperCase().trim();

    // Get latest price
    const prices = await PriceRepository.getAllLatestPrices();
    const priceData = prices.find((p) => p.symbol === ticker);

    // Get fundamentals
    const fundamentals = await FundamentalRepository.getFundamentals(ticker, period);

    if (fundamentals.length === 0) {
        return {
            message: `No fundamental data found for ${ticker}. Ratios cannot be computed without financial statements.`,
            suggestion: `Use the ngx_metrics tool with "${ticker}" to parse the company's annual report first.`,
        };
    }

    // Build a metric lookup map
    const metricMap = new Map<string, number>();
    for (const f of fundamentals) {
        const val = parseFloat(f.value);
        if (!isNaN(val)) {
            metricMap.set(f.metric, val);
        }
    }

    const currentPrice = priceData?.close ?? null;
    const eps = metricMap.get('eps') ?? null;
    const dps = metricMap.get('dps') ?? null;
    const navPerShare = metricMap.get('nav_per_share') ?? null;
    const totalEquity = metricMap.get('total_equity') ?? null;
    const totalAssets = metricMap.get('total_assets') ?? null;
    const totalDebt = metricMap.get('total_debt') ?? null;
    const pat = metricMap.get('profit_after_tax') ?? null;
    const revenue = metricMap.get('revenue') ?? null;
    const sharesOutstanding = metricMap.get('shares_outstanding') ?? null;

    const ratios: RatioResult[] = [];

    // --- Price-based ratios (require current price) ---

    // P/E Ratio
    if (currentPrice !== null && eps !== null && eps !== 0) {
        ratios.push({
            ratio: 'P/E Ratio',
            value: Number((currentPrice / eps).toFixed(2)),
            description: 'Price-to-Earnings — how much investors pay per ₦1 of earnings',
        });
    } else {
        ratios.push({
            ratio: 'P/E Ratio',
            value: null,
            description: 'Price-to-Earnings',
            note: eps === null ? 'EPS data unavailable' : eps === 0 ? 'EPS is zero' : 'Current price unavailable',
        });
    }

    // P/B Ratio
    if (currentPrice !== null && navPerShare !== null && navPerShare !== 0) {
        ratios.push({
            ratio: 'P/B Ratio',
            value: Number((currentPrice / navPerShare).toFixed(2)),
            description: 'Price-to-Book — how much investors pay per ₦1 of net assets',
        });
    } else {
        ratios.push({
            ratio: 'P/B Ratio',
            value: null,
            description: 'Price-to-Book',
            note: navPerShare === null ? 'NAV per share data unavailable' : 'Current price unavailable',
        });
    }

    // Dividend Yield
    if (currentPrice !== null && dps !== null && currentPrice !== 0) {
        ratios.push({
            ratio: 'Dividend Yield',
            value: Number(((dps / currentPrice) * 100).toFixed(2)),
            description: 'Annual dividend as % of current share price',
        });
    } else {
        ratios.push({
            ratio: 'Dividend Yield',
            value: null,
            description: 'Annual dividend as % of share price',
            note: dps === null ? 'DPS data unavailable' : 'Current price unavailable',
        });
    }

    // Market Cap
    if (currentPrice !== null && sharesOutstanding !== null) {
        const marketCap = currentPrice * sharesOutstanding;
        ratios.push({
            ratio: 'Market Cap (₦)',
            value: Number(marketCap.toFixed(0)),
            description: 'Total market capitalisation = shares outstanding × current price',
        });
    }

    // --- Profitability ratios ---

    // ROE
    if (pat !== null && totalEquity !== null && totalEquity !== 0) {
        ratios.push({
            ratio: 'ROE',
            value: Number(((pat / totalEquity) * 100).toFixed(2)),
            description: 'Return on Equity — PAT as % of shareholders\' funds',
        });
    } else {
        ratios.push({
            ratio: 'ROE',
            value: null,
            description: 'Return on Equity',
            note: 'PAT or total equity data unavailable',
        });
    }

    // ROA
    if (pat !== null && totalAssets !== null && totalAssets !== 0) {
        ratios.push({
            ratio: 'ROA',
            value: Number(((pat / totalAssets) * 100).toFixed(2)),
            description: 'Return on Assets — PAT as % of total assets',
        });
    } else {
        ratios.push({
            ratio: 'ROA',
            value: null,
            description: 'Return on Assets',
            note: 'PAT or total assets data unavailable',
        });
    }

    // Net Profit Margin
    if (pat !== null && revenue !== null && revenue !== 0) {
        ratios.push({
            ratio: 'Net Profit Margin',
            value: Number(((pat / revenue) * 100).toFixed(2)),
            description: 'PAT as % of total revenue',
        });
    }

    // --- Leverage ratios ---

    // Debt-to-Equity
    if (totalDebt !== null && totalEquity !== null && totalEquity !== 0) {
        ratios.push({
            ratio: 'Debt-to-Equity',
            value: Number((totalDebt / totalEquity).toFixed(2)),
            description: 'Total borrowings divided by shareholders\' funds — measures financial leverage',
        });
    } else {
        ratios.push({
            ratio: 'Debt-to-Equity',
            value: null,
            description: 'Debt-to-Equity ratio',
            note: 'Debt or equity data unavailable',
        });
    }

    // EPS (include for reference)
    if (eps !== null) {
        ratios.push({
            ratio: 'EPS (₦)',
            value: Number(eps.toFixed(2)),
            description: 'Earnings Per Share in Naira',
        });
    }

    // DPS (include for reference)
    if (dps !== null) {
        ratios.push({
            ratio: 'DPS (₦)',
            value: Number(dps.toFixed(2)),
            description: 'Dividend Per Share in Naira',
        });
    }

    return ratios;
}
