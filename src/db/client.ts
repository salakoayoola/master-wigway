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
 */
export async function initDb() {
  const sqlite = await getDb();

  // Prices table
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

  // Fundamentals table
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

  console.log('Database initialized at:', DB_PATH);
}
