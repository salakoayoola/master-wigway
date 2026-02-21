# Master Wigway: Agent Migration Context

## Project Overview
**Master Wigway** is a localized fork of the Dexter financial agent, specifically optimized for the **Nigerian Exchange (NGX)** and the Nigerian financial market. 

### Core Objectives
1. **NGX Intelligence**: Real-time price scraping and historical data storage for Nigerian equities.
2. **Document Analysis**: Automated monitoring of the NGX Disclosure Portal and LLM-powered parsing of corporate annual reports (PDFs).
3. **WhatsApp Interface**: A mobile-first gateway allowing users to query financial metrics, prices, and valuations via WhatsApp.

---

## Current Status & Progress
We are currently in the middle of **Slice 5: WhatsApp Gateway Integration**.

### Accomplishments
- **Database Layer**: Refactored to use `sqlite3` and the `sqlite` wrapper. This ensures compatibility with both Bun and Node.js (tsx) environments and supports asynchronous operations required by the gateway.
- **Local Storage**: Standardized all storage (database, credentials, sessions, logs) to the project-local `./storage` directory. This bypasses permission issues previously encountered in home directories.
- **NGX Tools**: 
    - Daily price scraper is functional and caches to the local DB.
    - Disclosure portal scraper is implemented.
    - PDF-to-text utility is optimized with lazy-loading for terminal environments (avoiding `DOMMatrix` errors).
- **Hardened Gateway**: The WhatsApp session logic (`src/gateway/channels/whatsapp/session.ts`) has been tuned with:
    - `qrTimeout`: 120,000ms (2 minutes).
    - Hardened `keepAliveIntervalMs` and `connectTimeoutMs`.
    - Standardized browser identifier (`['Ubuntu', 'Chrome', '20.0.04']`).
    - Enhanced diagnostic logging for `WA-WARN` and `WA-ERROR`.

### Current Blocker: WhatsApp Linkage
- **Issue**: Attempting to scan the QR code via `npm run gateway:login` often results in "Connection Terminated by Server" (HTTP 428) after several minutes.
- **Latest Attempt (#7)**: Stayed open for 17 minutes with no local pairing success before termination.
- **Next Step**: Initiate **Attempt #8** and monitor if the user's scan triggers the creation of `storage/credentials/whatsapp/default/creds.json`.

---

## Migration Instructions for the Next Agent

### 1. Environment Setup
Ensure you have a `.env` file with the following (as per original Dexter requirements):
```bash
# LLM Provider (OpenRouter/OpenAI/Anthropic)
OPENROUTER_API_KEY=...
# Optional: DEXTER_SESSIONS_DIR, but defaults to ./storage/sessions in this fork.
```

### 2. Running the Gateway
- **Linking**: `npm run gateway:login` (requires manual QR scan).
- **Execution**: `npm run gateway`.
- **Note**: If the QR code is hard to read due to logs, check `SUPPRESSED_PREFIXES` in `src/gateway/index.ts`.

### 3. Key Files
- [AGENTS.md](file:///Users/ayoolasalako/vs-code-projects/master-wigway/AGENTS.md): This file.
- [task.md](file:///Users/ayoolasalako/.gemini/antigravity/brain/b865d645-cc3c-4b96-a8ee-c9955e2f81a4/task.md): Detailed progress tracker.
- [implementation_plan.md](file:///Users/ayoolasalako/.gemini/antigravity/brain/b865d645-cc3c-4b96-a8ee-c9955e2f81a4/implementation_plan.md): Technical roadmap.
- `src/db/client.ts`: Asynchronous SQLite initialization.
- `src/gateway/channels/whatsapp/session.ts`: WhatsApp connection configuration.

### 4. Verification
After migration, verify the database:
```bash
# Check if prices exist
sqlite3 storage/wigway.db "SELECT * FROM prices LIMIT 5;"
```
