import { parseHTML } from 'linkedom';

export interface ScrapedNgxPrice {
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    percentChange: number;
}

/**
 * Fetches live equities price list from the NGX website.
 * URL: https://ngxgroup.com/exchange/data/equities-price-list/
 */
export async function fetchNgxPrices(): Promise<ScrapedNgxPrice[]> {
    const url = 'https://ngxgroup.com/exchange/data/equities-price-list/';

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch NGX price list: ${response.statusText}`);
        }

        const html = await response.text();
        const { document } = parseHTML(html);

        // The table ID found during research
        const table = document.querySelector('table#latestdiclosuresEquities');
        if (!table) {
            throw new Error('Could not find price table on NGX website');
        }

        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const prices: ScrapedNgxPrice[] = [];

        for (const row of rows) {
            const cols = row.querySelectorAll('td');
            if (cols.length < 7) continue;

            const symbol = cols[0].textContent?.trim() || '';
            if (!symbol) continue;

            const parseNum = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;

            prices.push({
                symbol,
                open: parseNum(cols[2].textContent || '0'),
                high: parseNum(cols[3].textContent || '0'),
                low: parseNum(cols[4].textContent || '0'),
                close: parseNum(cols[5].textContent || '0'),
                change: parseNum(cols[6].textContent || '0'),
                percentChange: 0, // Calculate if needed, but the table might have it
            });
        }

        return prices;
    } catch (error) {
        console.error('Error fetching NGX prices:', error);
        throw error;
    }
}
