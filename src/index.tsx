#!/usr/bin/env bun
import { config } from 'dotenv';
import { runCli } from './cli.js';
import { initDb } from './db/client.js';

// Load environment variables
config({ quiet: true });

// Initialize database
async function start() {
    try {
        await initDb();
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
    const model = process.env.OPENAI_MODEL || 'gpt-5.2';
}

await start();
await runCli();
