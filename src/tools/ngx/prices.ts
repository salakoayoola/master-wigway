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
 * Fetches live equities price list from the NGX website's internal REST API.
 */
export async function fetchNgxPrices(): Promise<ScrapedNgxPrice[]> {
    const url = 'https://doclib.ngxgroup.com/REST/api/statistics/equities/?market=&sector=&orderby=&pageSize=300&pageNo=0';

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json;odata=verbose',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch NGX price list: ${response.statusText}`);
        }

        const data: any[] = await response.json();

        return data.map(item => ({
            symbol: item.Symbol || '',
            open: item.OpeningPrice || 0,
            high: item.HighPrice || item.OpeningPrice || 0,
            low: item.LowPrice || item.OpeningPrice || 0,
            close: item.ClosePrice || 0,
            change: item.Change || (item.ClosePrice - item.PrevClosingPrice) || 0,
            percentChange: item.PercChange || item.CalculateChangePercent || 0
        })).filter(p => !!p.symbol);

    } catch (error) {
        console.error('Error fetching NGX prices:', error);
        return [];
    }
}
