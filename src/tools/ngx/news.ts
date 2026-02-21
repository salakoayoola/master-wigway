import { exaSearch } from '../search/index.js';
import { formatToolResult, parseSearchResults } from '../types.js';

// ---------------------------------------------------------------------------
// Nigerian Financial News Sources — query templates
// ---------------------------------------------------------------------------

const NGX_NEWS_SOURCES = [
    'site:nairametrics.com',
    'site:businessday.ng',
    'site:proshare.co',
    'site:stockswatch.ng',
    'site:stocksng.com',
    'site:thisdaylive.com',
    'site:guardian.ng',
] as const;

/**
 * Topic-specific query templates for Nigerian financial news.
 */
const TOPIC_TEMPLATES: Record<string, string> = {
    earnings: 'financial results earnings profit revenue',
    dividends: 'dividend declaration payment ex-dividend',
    'M&A': 'acquisition merger takeover',
    regulation: 'SEC CBN regulation compliance',
    agm: 'annual general meeting AGM shareholder',
    rights: 'rights issue offer subscription',
    default: '',
};

interface NgxNewsResult {
    title: string;
    source: string;
    date: string;
    snippet: string;
    url: string;
}

/**
 * Fetches NGX-relevant news for a given company or topic.
 *
 * Wraps the existing Exa/Tavily/Perplexity web search tools with
 * NGX-optimised query templates targeting Nigerian financial sources.
 *
 * @param query - Company ticker or name, optionally with topic
 * @param topic - Optional topic filter (earnings, dividends, M&A, regulation, agm, rights)
 * @returns Deduplicated array of news results
 */
export async function fetchNews(
    query: string,
    topic?: string
): Promise<NgxNewsResult[]> {
    const topicSuffix = TOPIC_TEMPLATES[topic ?? ''] ?? TOPIC_TEMPLATES.default;

    // Build search queries targeting multiple Nigerian sources
    // We pick the top 3 most relevant sources to avoid overwhelming the search
    const sourceSuffixes = NGX_NEWS_SOURCES.slice(0, 3);

    const searchQueries = sourceSuffixes.map(
        (source) => `${query} ${topicSuffix} ${source} Nigeria NGX`.trim()
    );

    // Also do one broad search without site restriction
    searchQueries.push(`${query} ${topicSuffix} Nigeria stock exchange NGX`.trim());

    const allResults: NgxNewsResult[] = [];
    const seenUrls = new Set<string>();

    for (const searchQuery of searchQueries) {
        try {
            const rawResult = await exaSearch.invoke({ query: searchQuery });
            const { parsed } = parseSearchResults(rawResult);

            // Extract results from parsed response
            const results = extractResults(parsed);
            for (const result of results) {
                if (!seenUrls.has(result.url)) {
                    seenUrls.add(result.url);
                    allResults.push(result);
                }
            }
        } catch (error) {
            // Individual search failures shouldn't break the whole news fetch
            console.warn(`News search failed for query "${searchQuery}":`, error);
        }
    }

    return allResults;
}

/**
 * Extracts structured news results from a raw search response.
 */
function extractResults(parsed: unknown): NgxNewsResult[] {
    if (!parsed || typeof parsed !== 'object') return [];

    // Handle { results: [...] } shape (Exa format)
    let rawResults: unknown[] = [];
    if ('results' in parsed && Array.isArray((parsed as Record<string, unknown>).results)) {
        rawResults = (parsed as Record<string, unknown>).results as unknown[];
    } else if ('data' in parsed) {
        const data = (parsed as Record<string, unknown>).data;
        if (Array.isArray(data)) {
            rawResults = data;
        } else if (data && typeof data === 'object' && 'results' in (data as Record<string, unknown>)) {
            rawResults = ((data as Record<string, unknown>).results as unknown[]) ?? [];
        }
    } else if (Array.isArray(parsed)) {
        rawResults = parsed;
    }

    return rawResults
        .filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object')
        .map((r) => ({
            title: String(r.title ?? r.name ?? ''),
            source: extractDomain(String(r.url ?? '')),
            date: String(r.publishedDate ?? r.date ?? r.created_at ?? ''),
            snippet: String(r.text ?? r.snippet ?? r.description ?? '').slice(0, 300),
            url: String(r.url ?? ''),
        }))
        .filter((r) => r.url && r.title);
}

/**
 * Extracts the domain name from a URL for source attribution.
 */
function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
}
