import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync } from 'fs';

const DB_DIR = join(process.cwd(), 'storage');
const DB_PATH = join(DB_DIR, 'financials.db');

// Ensure directory exists
try {
  mkdirSync(DB_DIR, { recursive: true });
} catch (err) {
  // Ignore if exists
}

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    // Enable WAL mode for better performance
    await db.exec('PRAGMA journal_mode = WAL;');
  }
  return db;
}

/**
 * Initialize the database schema.
 * Creates all required tables if they don't already exist.
 */
export async function initDb() {
  const sqlite = await getDb();

  // --- Companies table ---
  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      ticker TEXT PRIMARY KEY,
      name TEXT,
      sector TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);

  // --- Prices table ---
  await sqlite.exec(`
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

  // --- Legacy fundamentals table (kept for backward compatibility) ---
  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS fundamentals (
      symbol TEXT NOT NULL,
      metric TEXT NOT NULL,
      value TEXT,
      period TEXT,
      timestamp INTEGER NOT NULL,
      PRIMARY KEY (symbol, metric, period)
    )
  `);

  // --- Annual financials table ---
  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS annual_financials (
      ticker TEXT NOT NULL,
      year INTEGER NOT NULL,
      metric TEXT NOT NULL,
      value TEXT,
      timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      PRIMARY KEY (ticker, year, metric)
    )
  `);

  // --- Quarterly financials table ---
  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS quarterly_financials (
      ticker TEXT NOT NULL,
      quarter TEXT NOT NULL,
      year INTEGER NOT NULL,
      metric TEXT NOT NULL,
      value TEXT,
      timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      PRIMARY KEY (ticker, quarter, year, metric)
    )
  `);

  console.log('Database initialized at:', DB_PATH);
}
