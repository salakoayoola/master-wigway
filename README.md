# Master Wigway 🇳🇬

Master Wigway is an autonomous financial research agent specifically adapted for the **Nigerian Stock Exchange (NGX)**. Forked from [Dexter](https://github.com/virattt/dexter), it is designed to think, plan, and execute deep analysis on Nigerian equities.

**Tribute:** This project is named in honor of the late **Herbert Wigwe**, a visionary leader and pioneering Nigerian bank chief who transformed the African financial landscape.

<img width="1098" height="659" alt="Master Wigway" src="https://github.com/user-attachments/assets/3bcc3a7f-b68a-4f5e-8735-9d22196ff76e" />

## Table of Contents

- [👋 Overview](#-overview)
- [✅ Prerequisites](#-prerequisites)
- [💻 How to Install](#-how-to-install)
- [🚀 How to Run](#-how-to-run)
- [🎛️ CLI Commands](#-cli-commands)
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

<img width="1042" height="638" alt="Screenshot" src="https://github.com/user-attachments/assets/2a6334f9-863f-4bd2-a56f-923e42f4711e" />


## ✅ Prerequisites

- [Bun](https://bun.com) runtime (v1.0 or higher)
- At least one LLM API key (Google Gemini recommended — get [here](https://aistudio.google.com/apikey))

**Optional API keys:**
- [Exa](https://exa.ai) or [Tavily](https://tavily.com) — for web search / news
- [Perplexity](https://perplexity.ai) — alternative search provider

You do **not** need an OpenAI or Financial Datasets API key — Wigway uses free NGX data sources.

#### Installing Bun

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
git clone https://github.com/salakoayoola/master-wigway.git
cd master-wigway
```

2. Install dependencies with Bun:
```bash
bun install
```

3. Set up your environment variables:
```bash
# Copy the example environment file
cp env.example .env

# Edit .env and add your API key(s)
# At minimum, set one LLM key:
# GOOGLE_API_KEY=your-google-ai-api-key
#
# Optional search providers:
# EXASEARCH_API_KEY=your-exa-api-key
# PERPLEXITY_API_KEY=your-perplexity-api-key
# TAVILY_API_KEY=your-tavily-api-key
```

## 🚀 How to Run

Run Wigway in interactive mode:
```bash
bun start
```

Or with watch mode for development:
```bash
bun dev
```

## 🎛️ CLI Commands

Once Wigway is running, you can use these commands in the input prompt:

| Command | Description |
|---------|-------------|
| `/model` | Switch LLM provider and model (Google, Anthropic, OpenAI, etc.) |
| `exit` or `quit` | Exit the CLI |
| `Esc` | Cancel current agent execution or model selection |
| `Ctrl+C` | Force quit |

### Switching Models

Type `/model` to open the provider selector. You can choose from:

| Provider | Models | API Key |
|----------|--------|---------|
| **Google** | Gemini 3 Flash, Gemini 3 Pro | `GOOGLE_API_KEY` |
| **Anthropic** | Sonnet 4.6, Opus 4.6 | `ANTHROPIC_API_KEY` |
| **OpenAI** | GPT 5.2, GPT 4.1 | `OPENAI_API_KEY` |
| **xAI** | Grok 4, Grok 4.1 Fast Reasoning | `XAI_API_KEY` |
| **Moonshot** | Kimi K2.5 | `MOONSHOT_API_KEY` |
| **DeepSeek** | DeepSeek V3, DeepSeek R1 | `DEEPSEEK_API_KEY` |
| **OpenRouter** | Any model (type name) | `OPENROUTER_API_KEY` |
| **Ollama** | Local models | No key needed |

Your selection is saved to `~/.master-wigway/settings.json` and persists across sessions.

### Available Tools

Wigway has access to these tools for research:

| Tool | Description |
|------|-------------|
| `ngx_search` | Live NGX stock prices from ngxgroup.com |
| `ngx_metrics` | Financial metrics extracted from annual reports |
| `read_disclosures` | Corporate disclosures and filings from NGX |
| `web_search` | Web search via Exa/Tavily/Perplexity |
| `web_fetch` | Fetch and parse any web page |
| `browser` | Full browser for complex web interactions |
| `skill` | Specialized workflows (e.g., DCF valuation) |

## 📊 How to Evaluate

Wigway includes an evaluation suite that tests the agent against a dataset of NGX financial questions. Evals use LangSmith for tracking and an LLM-as-judge approach for scoring correctness.

**Run on all questions:**
```bash
bun run src/evals/run.ts
```

**Run on a random sample:**
```bash
bun run src/evals/run.ts --sample 10
```

The eval runner displays a real-time UI showing progress, current question, and running accuracy statistics. Results are logged to LangSmith for analysis.

## 🐛 How to Debug

Wigway logs all tool calls to a scratchpad file for debugging and history tracking. Each query creates a new JSONL file in `.master-wigway/scratchpad/`.

**Scratchpad location:**
```
.master-wigway/scratchpad/
├── 2026-02-21-111400_9a8f10723f79.jsonl
├── 2026-02-21-143022_a1b2c3d4e5f6.jsonl
└── ...
```

Each file contains newline-delimited JSON entries tracking:
- **init**: The original query
- **tool_result**: Each tool call with arguments, raw result, and LLM summary
- **thinking**: Agent reasoning steps

**Example scratchpad entry:**
```json
{"type":"tool_result","timestamp":"2026-02-21T11:14:05.123Z","toolName":"ngx_search","args":{"query":"DANGCEM"},"result":{...},"llmSummary":"Retrieved current price data for Dangote Cement showing close at ₦450.50"}
```

## 📱 How to Use with WhatsApp

Chat with Wigway through WhatsApp by linking your phone to the gateway. Messages you send to yourself are processed by Wigway and responses are sent back to the same chat.

**Quick start:**
```bash
# Link your WhatsApp account (scan QR code)
bun run gateway:login

# Start the gateway
bun run gateway
```

Then open WhatsApp, go to your own chat (message yourself), and ask Wigway a question.

For detailed setup instructions, configuration options, and troubleshooting, see the [WhatsApp Gateway README](src/gateway/channels/whatsapp/README.md).

## 🤝 How to Contribute

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

**Important**: Please keep your pull requests small and focused. This will make it easier to review and merge.


## 📄 License

This project is licensed under the MIT License.
