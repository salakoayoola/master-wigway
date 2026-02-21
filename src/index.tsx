#!/usr/bin/env bun
import { config } from 'dotenv';
import { runCli } from './cli.js';
import { initDb } from './db/client.js';

// Load environment variables
config({ quiet: true });

// Initialize database
try {
    initDb();
} catch (error) {
    console.error('Failed to initialize database:', error);
}

await runCli();
