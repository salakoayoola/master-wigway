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
}

await start();
await runCli();
