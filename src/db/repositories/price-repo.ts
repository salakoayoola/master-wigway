import { getDb } from '../client.js';

export interface NgxPrice {
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    price_change: number;
    timestamp: number;
}

export class PriceRepository {
    /**
     * Saves a list of ticker prices to the database.
     */
    static async savePrices(prices: NgxPrice[]) {
        const db = await getDb();
        const timestamp = Date.now();

        // We use a transaction for efficiency
        await db.exec('BEGIN TRANSACTION');
        try {
            const stmt = await db.prepare(`
        INSERT OR REPLACE INTO prices (symbol, open, high, low, close, price_change, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

            for (const price of prices) {
                await stmt.run(
                    price.symbol,
                    price.open,
                    price.high,
                    price.low,
                    price.close,
                    price.price_change,
                    timestamp
                );
            }
            await stmt.finalize();
            await db.exec('COMMIT');
        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }
    }

    /**
     * Retrieves the latest price for a specific symbol.
     */
    static async getLatestPrice(symbol: string): Promise<NgxPrice | null> {
        const db = await getDb();
        const row = await db.get(
            'SELECT * FROM prices WHERE symbol = ? ORDER BY timestamp DESC LIMIT 1',
            symbol
        );
        return row as NgxPrice || null;
    }

    /**
     * Retrieves all latest prices (from the most recent scrape timestamp).
     */
    static async getAllLatestPrices(): Promise<NgxPrice[]> {
        const db = await getDb();
        const latestTimestamp = await db.get('SELECT MAX(timestamp) as ts FROM prices');

        if (!latestTimestamp || !latestTimestamp.ts) {
            return [];
        }

        const rows = await db.all(
            'SELECT * FROM prices WHERE timestamp = ?',
            latestTimestamp.ts
        );

        return rows as NgxPrice[];
    }
}
