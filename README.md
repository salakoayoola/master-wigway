# Master Wigway 🇳🇬

Master Wigway is an autonomous financial research agent specifically adapted for the **Nigerian Stock Exchange (NGX)**. Forked from [Dexter](https://github.com/virattt/dexter), it is designed to think, plan, and execute deep analysis on Nigerian equities.

**Tribute:** This project is named in honor of the late **Herbert Wigwe**, a visionary leader and pioneering Nigerian bank chief who transformed the African financial landscape.

<img width="1098" height="659" alt="Master Wigway" src="https://github.com/user-attachments/assets/3bcc3a7f-b68a-4f5e-8735-9d22196ff76e" />

## Table of Contents

- [👋 Overview](#-overview)
- [✅ Prerequisites](#-prerequisites)
- [💻 How to Install](#-how-to-install)
- [🚀 How to Run](#-how-to-run)
- [📊 How to Evaluate](#-how-to-evaluate)
- [🐛 How to Debug](#-how-to-debug)
- [📱 How to Use with WhatsApp](#-how-to-use-with-whatsapp)
- [🤝 How to Contribute](#-how-to-contribute)
- [📄 License](#-license)


## 👋 Overview

Master Wigway takes complex questions about Nigerian stocks and turns them into 1-day or multi-day research plans. It scrapes data from official NGX sources, parses corporate disclosures, and performs intrinsic valuation using Nigerian market parameters.

**Key Capabilities:**
- **NGX-Specific Research**: Decomposes queries into steps using tools for `ngxgroup.com` prices and disclosures.
- **Autonomous Execution**: Navigates Nigerian news, annual reports, and market data sources automatically.
- **Financial Intelligence**: Parses PDF annual reports into a local SQLite database for cross-year comparison.
- **Nigerian DCF Scenarios**: Valuation models adapted for Nigerian risk-free rates (FGN bonds) and market risk premiums.
- **Self-Reflecting Agent**: Constantly validates its findings against multiple sources (Nairametrics, Proshare, official filings).

[![Twitter Follow](https://img.shields.io/twitter/follow/virattt?style=social)](https://twitter.com/virattt) [![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=social&logo=discord)](https://discord.gg/jpGHv2XB6T)

<img width="1042" height="638" alt="Screenshot 2026-02-18 at 12 21 25 PM" src="https://github.com/user-attachments/assets/2a6334f9-863f-4bd2-a56f-923e42f4711e" />


## ✅ Prerequisites

- [Bun](https://bun.com) runtime (v1.0 or higher)
- OpenAI API key (get [here](https://platform.openai.com/api-keys))
- Financial Datasets API key (get [here](https://financialdatasets.ai))
- Exa API key (get [here](https://exa.ai)) - optional, for web search

#### Installing Bun

If you don't have Bun installed, you can install it using curl:

**macOS/Linux:**
```bash
curl -fsSL https://bun.com/install | bash
```

**Windows:**
```bash
powershell -c "irm bun.sh/install.ps1|iex"
```

After installation, restart your terminal and verify Bun is installed:
```bash
bun --version
```

## 💻 How to Install

1. Clone the repository:
```bash
git clone https://github.com/virattt/dexter.git
cd dexter
```

2. Install dependencies with Bun:
```bash
bun install
```

3. Set up your environment variables:
```bash
# Copy the example environment file
cp env.example .env

# Edit .env and add your API keys (if using cloud providers)
# OPENAI_API_KEY=your-openai-api-key
# ANTHROPIC_API_KEY=your-anthropic-api-key (optional)
# GOOGLE_API_KEY=your-google-api-key (optional)
# XAI_API_KEY=your-xai-api-key (optional)
# OPENROUTER_API_KEY=your-openrouter-api-key (optional)

# Institutional-grade market data for agents; AAPL, NVDA, MSFT are free
# FINANCIAL_DATASETS_API_KEY=your-financial-datasets-api-key

# (Optional) If using Ollama locally
# OLLAMA_BASE_URL=http://127.0.0.1:11434

# Web Search (Exa preferred, Tavily fallback)
# EXASEARCH_API_KEY=your-exa-api-key
# TAVILY_API_KEY=your-tavily-api-key
```

## 🚀 How to Run

Run Dexter in interactive mode:
```bash
bun start
```

Or with watch mode for development:
```bash
bun dev
```

## 📊 How to Evaluate

Dexter includes an evaluation suite that tests the agent against a dataset of financial questions. Evals use LangSmith for tracking and an LLM-as-judge approach for scoring correctness.

**Run on all questions:**
```bash
bun run src/evals/run.ts
```

**Run on a random sample of data:**
```bash
bun run src/evals/run.ts --sample 10
```

The eval runner displays a real-time UI showing progress, current question, and running accuracy statistics. Results are logged to LangSmith for analysis.

## 🐛 How to Debug

Dexter logs all tool calls to a scratchpad file for debugging and history tracking. Each query creates a new JSONL file in `.dexter/scratchpad/`.

**Scratchpad location:**
```
.dexter/scratchpad/
├── 2026-01-30-111400_9a8f10723f79.jsonl
├── 2026-01-30-143022_a1b2c3d4e5f6.jsonl
└── ...
```

Each file contains newline-delimited JSON entries tracking:
- **init**: The original query
- **tool_result**: Each tool call with arguments, raw result, and LLM summary
- **thinking**: Agent reasoning steps

**Example scratchpad entry:**
```json
{"type":"tool_result","timestamp":"2026-01-30T11:14:05.123Z","toolName":"get_income_statements","args":{"ticker":"AAPL","period":"annual","limit":5},"result":{...},"llmSummary":"Retrieved 5 years of Apple annual income statements showing revenue growth from $274B to $394B"}
```

This makes it easy to inspect exactly what data the agent gathered and how it interpreted results.

## 📱 How to Use with WhatsApp

Chat with Dexter through WhatsApp by linking your phone to the gateway. Messages you send to yourself are processed by Dexter and responses are sent back to the same chat.

**Quick start:**
```bash
# Link your WhatsApp account (scan QR code)
bun run gateway:login

# Start the gateway
bun run gateway
```

Then open WhatsApp, go to your own chat (message yourself), and ask Dexter a question.

For detailed setup instructions, configuration options, and troubleshooting, see the [WhatsApp Gateway README](src/gateway/channels/whatsapp/README.md).

## 🤝 How to Contribute

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

**Important**: Please keep your pull requests small and focused.  This will make it easier to review and merge.


## 📄 License

This project is licensed under the MIT License.
