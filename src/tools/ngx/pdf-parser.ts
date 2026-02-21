import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * Fetches a PDF from a URL and extracts its text content.
 */
export async function extractTextFromPdf(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF from ${url}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const dataBuffer = Buffer.from(arrayBuffer);

        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error;
    }
}

/**
 * Uses LLM to extract structured financial data from the extracted text.
 * This will be refined as we define the extraction prompt.
 */
export async function extractFinancialsWithLlm(text: string, model: any): Promise<any> {
    // We take the first 10,000 characters or find relevant pages (financial highlights)
    // For now, let's just grab the first chunk to demonstrate
    const chunk = text.slice(0, 15000);

    const prompt = `
Extract the following financial metrics from the provided annual report text chunk.
Return the result as a JSON object. If a value is missing, return null.

Metrics to extract:
- Revenue (or Turnover)
- Profit Before Tax
- Profit After Tax (Net Income)
- Total Assets
- Total Equity (Shareholders' Funds)
- Reporting Period (e.g., "Full Year 2023")

Text Chunk:
---
${chunk}
---
`;

    // The actual LLM call would happen here.
    // We'll integrate this with the agent's model later.
    return {
        message: "LLM extraction logic placeholder",
        prompt: prompt.slice(0, 200) + "..."
    };
}
