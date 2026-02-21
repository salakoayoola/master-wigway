import { Database } from 'bun:sqlite';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync } from 'fs';

const DB_DIR = join(homedir(), '.master-wigway');
const DB_PATH = join(DB_DIR, 'financials.db');

// Ensure directory exists
try {
    mkdirSync(DB_DIR, { recursive: true });
} catch (err) {
    // Ignore if exists
}

let db: Database;

export function getDb(): Database {
    if (!db) {
        db = new Database(DB_PATH);
        // Enable WAL mode for better performance
        db.exec('PRAGMA journal_mode = WAL;');
    }
    return db;
}

/**
 * Initialize the database schema.
 */
export function initDb() {
    const sqlite = getDb();

    // Prices table
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS prices (
      symbol TEXT NOT NULL,
      open REAL,
      high REAL,
      low REAL,
      close REAL,
      price_change REAL,
      timestamp INTEGER NOT NULL,
      PRIMARY KEY (symbol, timestamp)
    )
  `);

    // Fundamentals table
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS fundamentals (
      symbol TEXT NOT NULL,
      metric TEXT NOT NULL,
      value TEXT,
      period TEXT,
      timestamp INTEGER NOT NULL,
      PRIMARY KEY (symbol, metric, period)
    )
  `);

    console.log('Database initialized at:', DB_PATH);
}
