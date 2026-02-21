import { parseHTML } from 'linkedom';

export interface NgxDisclosure {
    symbol: string;
    type: string;
    title: string;
    date: string;
    link: string;
}

/**
 * Scrapes the NGX disclosures portal for a specific company or keywords.
 * Default searches for 'AUDITED FINANCIAL STATEMENT' or 'ANNUAL REPORT'.
 */
export async function searchNgxDisclosures(query: string = ''): Promise<NgxDisclosure[]> {
    const url = 'https://ngxgroup.com/exchange/data/corporate-disclosures/';

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch NGX disclosures: ${response.statusText}`);
        }

        const html = await response.text();
        const { document } = parseHTML(html);

        // Selector identified during research
        const table = document.querySelector('table#latestdiclosuresLanding');
        if (!table) {
            // It might be loaded via AJAX/DataTables, but let's try initial HTML
            return [];
        }

        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const disclosures: NgxDisclosure[] = [];

        for (const row of rows) {
            const cols = row.querySelectorAll('td');
            if (cols.length < 3) continue;

            const symbol = cols[0].textContent?.trim() || '';
            const titleLink = cols[1].querySelector('a');
            const title = titleLink?.textContent?.trim() || '';
            const link = titleLink?.getAttribute('href') || '';
            const date = cols[2].textContent?.trim() || '';
            const type = cols[3]?.textContent?.trim() || '';

            if (query && !symbol.toLowerCase().includes(query.toLowerCase()) && !title.toLowerCase().includes(query.toLowerCase())) {
                continue;
            }

            disclosures.push({
                symbol,
                title,
                link,
                date,
                type
            });
        }

        return disclosures;
    } catch (error) {
        console.error('Error searching NGX disclosures:', error);
        throw error;
    }
}
