import { type StructuredToolInterface, DynamicStructuredTool } from '@langchain/core/tools';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseDotenv } from 'dotenv';
import { z } from 'zod';
import { formatToolResult } from './types.js';
import { createFinancialSearch, createFinancialMetrics, createReadFilings } from './ngx/index.js';
import { exaSearch, perplexitySearch, tavilySearch } from './search/index.js';
import { skillTool, SKILL_TOOL_DESCRIPTION } from './skill.js';
import { webFetchTool } from './fetch/index.js';
import { browserTool } from './browser/index.js';
import { readFileTool, writeFileTool, editFileTool } from './filesystem/index.js';
import { FINANCIAL_SEARCH_DESCRIPTION, FINANCIAL_METRICS_DESCRIPTION, WEB_SEARCH_DESCRIPTION, WEB_FETCH_DESCRIPTION, READ_FILINGS_DESCRIPTION, BROWSER_DESCRIPTION, READ_FILE_DESCRIPTION, WRITE_FILE_DESCRIPTION, EDIT_FILE_DESCRIPTION } from './descriptions/index.js';
import { discoverSkills } from '../skills/index.js';

/**
 * A registered tool with its rich description for system prompt injection.
 */
export interface RegisteredTool {
  /** Tool name (must match the tool's name property) */
  name: string;
  /** The actual tool instance */
  tool: StructuredToolInterface;
  /** Rich description for system prompt (includes when to use, when not to use, etc.) */
  description: string;
}

/**
 * Get all registered tools with their descriptions.
 * Conditionally includes tools based on environment configuration.
 *
 * @param model - The model name (needed for tools that require model-specific configuration)
 * @returns Array of registered tools
 */
export function getToolRegistry(model: string): RegisteredTool[] {
  const tools: RegisteredTool[] = [
    {
      name: 'ngx_search',
      tool: new DynamicStructuredTool({
        name: 'ngx_search',
        description: FINANCIAL_SEARCH_DESCRIPTION,
        schema: z.object({ query: z.string().describe('The search query or ticker symbol to look up') }),
        func: async (input) => {
          const fn = createFinancialSearch(model);
          const result = await fn(input.query);
          return formatToolResult(result);
        },
      }),
      description: FINANCIAL_SEARCH_DESCRIPTION,
    },
    {
      name: 'ngx_metrics',
      tool: new DynamicStructuredTool({
        name: 'ngx_metrics',
        description: FINANCIAL_METRICS_DESCRIPTION,
        schema: z.object({ query: z.string().describe('The company ticker symbol to get metrics for') }),
        func: async (input) => {
          const fn = createFinancialMetrics(model);
          const result = await fn(input.query);
          return formatToolResult(result);
        },
      }),
      description: FINANCIAL_METRICS_DESCRIPTION,
    },
    {
      name: 'read_disclosures',
      tool: new DynamicStructuredTool({
        name: 'read_disclosures',
        description: READ_FILINGS_DESCRIPTION,
        schema: z.object({ query: z.string().describe('The company ticker symbol to get disclosures for') }),
        func: async (input) => {
          const fn = createReadFilings(model);
          const result = await fn(input.query);
          return formatToolResult(result);
        },
      }),
      description: READ_FILINGS_DESCRIPTION,
    },
    {
      name: 'web_fetch',
      tool: webFetchTool,
      description: WEB_FETCH_DESCRIPTION,
    },
    {
      name: 'browser',
      tool: browserTool,
      description: BROWSER_DESCRIPTION,
    },
    {
      name: 'read_file',
      tool: readFileTool,
      description: READ_FILE_DESCRIPTION,
    },
    {
      name: 'write_file',
      tool: writeFileTool,
      description: WRITE_FILE_DESCRIPTION,
    },
    {
      name: 'edit_file',
      tool: editFileTool,
      description: EDIT_FILE_DESCRIPTION,
    },
  ];

  let exaKey = process.env.EXASEARCH_API_KEY;
  let perplexityKey = process.env.PERPLEXITY_API_KEY;
  let tavilyKey = process.env.TAVILY_API_KEY;

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const parsed = parseDotenv(fs.readFileSync(envPath, 'utf8'));
      exaKey = parsed.EXASEARCH_API_KEY ?? exaKey;
      perplexityKey = parsed.PERPLEXITY_API_KEY ?? perplexityKey;
      tavilyKey = parsed.TAVILY_API_KEY ?? tavilyKey;
    }
  } catch (err) { }

  // Include web_search if Exa, Perplexity, or Tavily API key is configured (Exa → Perplexity → Tavily)
  if (exaKey) {
    tools.push({
      name: 'web_search',
      tool: exaSearch,
      description: WEB_SEARCH_DESCRIPTION,
    });
  } else if (perplexityKey) {
    tools.push({
      name: 'web_search',
      tool: perplexitySearch,
      description: WEB_SEARCH_DESCRIPTION,
    });
  } else if (tavilyKey) {
    tools.push({
      name: 'web_search',
      tool: tavilySearch,
      description: WEB_SEARCH_DESCRIPTION,
    });
  }

  // Include skill tool if any skills are available
  const availableSkills = discoverSkills();
  if (availableSkills.length > 0) {
    tools.push({
      name: 'skill',
      tool: skillTool,
      description: SKILL_TOOL_DESCRIPTION,
    });
  }

  return tools;
}

/**
 * Get just the tool instances for binding to the LLM.
 *
 * @param model - The model name
 * @returns Array of tool instances
 */
export function getTools(model: string): StructuredToolInterface[] {
  return getToolRegistry(model).map((t) => t.tool);
}

/**
 * Build the tool descriptions section for the system prompt.
 * Formats each tool's rich description with a header.
 *
 * @param model - The model name
 * @returns Formatted string with all tool descriptions
 */
export function buildToolDescriptions(model: string): string {
  return getToolRegistry(model)
    .map((t) => `### ${t.name}\n\n${t.description}`)
    .join('\n\n');
}
