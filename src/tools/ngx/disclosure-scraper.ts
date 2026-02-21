export interface NgxDisclosure {
    symbol: string;
    type: string;
    title: string;
    date: string;
    link: string;
}

/**
 * Scrapes the NGX disclosures portal using its internal SharePoint REST API.
 */
export async function searchNgxDisclosures(query: string = ''): Promise<NgxDisclosure[]> {
    const url = "https://doclib.ngxgroup.com/_api/Web/Lists/GetByTitle('XFinancial_News')/items/?$select=URL,Modified,Created,CompanyName,CompanySymbol,InternationSecIN,Type_of_Submission&$orderby=Created%20desc&$Top=1000";

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json;odata=verbose',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch NGX disclosures: ${response.statusText}`);
        }

        const json = await response.json();
        const items: any[] = json.d?.results || json.value || [];

        const disclosures: NgxDisclosure[] = [];

        for (const item of items) {
            const symbol = item.CompanySymbol?.trim() || '';
            const title = item.URL?.Description?.trim() || '';
            const link = item.URL?.Url || '';
            const date = item.Created || item.Modified || '';
            const type = item.Type_of_Submission?.trim() || '';

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
        console.error('Error fetching NGX disclosures:', error);
        return [];
    }
}
