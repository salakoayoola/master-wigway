import { createRequire } from 'module';
import { z } from 'zod';
import { callLlm, getFastModel } from '@/model/llm';
import { resolveProvider } from '@/providers';

// ---------------------------------------------------------------------------
// Zod schema for structured financial extraction
// ---------------------------------------------------------------------------

const FinancialMetricSchema = z.object({
  reporting_period: z.string().describe('e.g. "Full Year 2023" or "Q2 2024"'),
  revenue: z.number().nullable().describe('Total revenue / turnover in Naira'),
  gross_profit: z.number().nullable().describe('Gross profit in Naira'),
  operating_profit: z.number().nullable().describe('Operating profit / EBIT in Naira'),
  profit_before_tax: z.number().nullable().describe('Profit before tax in Naira'),
  profit_after_tax: z.number().nullable().describe('Net income / PAT in Naira'),
  total_assets: z.number().nullable().describe('Total assets in Naira'),
  total_equity: z.number().nullable().describe("Shareholders' funds / equity in Naira"),
  total_debt: z.number().nullable().describe('Total borrowings / debt in Naira'),
  eps: z.number().nullable().describe('Earnings per share in Naira'),
  dps: z.number().nullable().describe('Dividend per share in Naira'),
  nav_per_share: z.number().nullable().describe('Net asset value per share in Naira'),
  shares_outstanding: z.number().nullable().describe('Number of ordinary shares outstanding'),
});

const FinancialExtractionSchema = z.object({
  company_name: z.string().describe('Full name of the company'),
  ticker: z.string().nullable().describe('NGX ticker symbol if mentioned'),
  periods: z.array(FinancialMetricSchema).describe('Financial data for each reporting period found'),
});

export type FinancialExtraction = z.infer<typeof FinancialExtractionSchema>;
export type FinancialMetric = z.infer<typeof FinancialMetricSchema>;

// ---------------------------------------------------------------------------
// PDF text extraction
// ---------------------------------------------------------------------------

const MIN_TEXT_THRESHOLD = 100; // chars — below this likely a scanned PDF

/**
 * Fetches a PDF from a URL and extracts its text content.
 * Lazy loads pdf-parse to avoid DOMMatrix reference errors during startup in Node.js.
 *
 * Returns the extracted text and a warning if the PDF appears to be scanned.
 */
export async function extractTextFromPdf(url: string): Promise<{ text: string; warning?: string }> {
  try {
    const require = createRequire(import.meta.url);
    const pdf = require('pdf-parse');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from ${url}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const dataBuffer = Buffer.from(arrayBuffer);

    const data = await pdf(dataBuffer);
    const text: string = data.text ?? '';
    const numPages: number = data.numpages ?? 1;

    // Scanned PDF detection: very little text relative to page count
    if (text.length < MIN_TEXT_THRESHOLD && numPages > 1) {
      return {
        text,
        warning: `This PDF appears to be a scanned image (${numPages} pages but only ${text.length} characters extracted). Text extraction may be incomplete or unreliable.`,
      };
    }

    return { text };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// LLM-powered structured financial extraction (BYOK — uses callLlm)
// ---------------------------------------------------------------------------

const EXTRACTION_SYSTEM_PROMPT = `You are a financial data extraction specialist for Nigerian Stock Exchange (NGX) companies.

Your task is to extract structured financial metrics from annual report text.
- All monetary values should be in Naira (₦). If the report shows values in thousands or millions, convert to full Naira amounts.
- If a value is not found in the text, return null for that field.
- If the report covers multiple years (e.g. comparative figures), extract data for each year as a separate period.
- Use Nigerian financial terminology: PAT (Profit After Tax), DPS (Dividend Per Share), etc.
- Be precise with numbers — do not estimate or hallucinate values.`;

/**
 * Uses LLM to extract structured financial data from annual report PDF text.
 *
 * Supports any provider configured via the project's BYOK model system
 * (OpenAI, Anthropic, Google, OpenRouter, Groq, DeepSeek, Ollama, etc.).
 *
 * @param text - Raw text extracted from the PDF
 * @param modelName - The model to use (resolves provider via BYOK system)
 * @returns Structured financial extraction result
 */
export async function extractFinancialsWithLlm(
  text: string,
  modelName: string
): Promise<FinancialExtraction> {
  // Use the fast/cheap model variant for extraction to save costs
  const provider = resolveProvider(modelName);
  const fastModel = getFastModel(provider.id, modelName);

  // Chunk the text — annual reports can be very long; take first ~30k chars
  // which typically covers income statement, balance sheet, and cash flow
  const chunk = text.slice(0, 30_000);

  const prompt = `Extract all financial metrics from the following annual report text.
If comparative figures for multiple years are present, extract each year separately.

Annual Report Text:
---
${chunk}
---

Return the structured extraction as JSON.`;

  const { response } = await callLlm(prompt, {
    model: fastModel,
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
    outputSchema: FinancialExtractionSchema,
  });

  // When outputSchema is used, callLlm returns the parsed object directly
  return response as unknown as FinancialExtraction;
}
