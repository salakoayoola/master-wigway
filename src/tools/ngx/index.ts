import { StructuredTool } from '@langchain/core/tools';

export const createFinancialSearch = (model: string) => ({} as any);
export const createFinancialMetrics = (model: string) => ({} as any);
export const createReadFilings = (model: string) => ({} as any);

export * from './prices.js';
export * from './disclosures.js';
export * from './pdf-parser.js';
export * from './fundamentals.js';
export * from './news.js';
export * from './ratios.js';
export * from './company-profile.js';
