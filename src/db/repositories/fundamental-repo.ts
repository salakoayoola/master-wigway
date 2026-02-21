import { getDb } from '../client.js';

export interface FundamentalMetric {
    symbol: string;
    metric: string;
    value: string;
    period: string;
}

export class FundamentalRepository {
    /**
     * Saves extracted fundamentals to the database.
     */
    static async saveFundamentals(fundamentals: FundamentalMetric[]) {
        const db = await getDb();
        const timestamp = Date.now();

        await db.exec('BEGIN TRANSACTION');
        try {
            const stmt = await db.prepare(`
        INSERT OR REPLACE INTO fundamentals (symbol, metric, value, period, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);

            for (const item of fundamentals) {
                await stmt.run(
                    item.symbol,
                    item.metric,
                    item.value,
                    item.period,
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
     * Retrieves fundamentals for a specific symbol and period.
     */
    static async getFundamentals(symbol: string, period?: string): Promise<FundamentalMetric[]> {
        const db = await getDb();
        let query = 'SELECT * FROM fundamentals WHERE symbol = ?';
        const params: any[] = [symbol];

        if (period) {
            query += ' AND period = ?';
            params.push(period);
        }

        const rows = await db.all(query, ...params);
        return rows as FundamentalMetric[];
    }
}
