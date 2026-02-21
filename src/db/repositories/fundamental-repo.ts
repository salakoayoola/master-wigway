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
    static saveFundamentals(fundamentals: FundamentalMetric[]) {
        const db = getDb();
        const timestamp = Date.now();

        const insert = db.prepare(`
      INSERT OR REPLACE INTO fundamentals (symbol, metric, value, period, timestamp)
      VALUES ($symbol, $metric, $value, $period, $timestamp)
    `);

        const transaction = db.transaction((list: FundamentalMetric[]) => {
            for (const item of list) {
                insert.run({
                    $symbol: item.symbol,
                    $metric: item.metric,
                    $value: item.value,
                    $period: item.period,
                    $timestamp: timestamp
                });
            }
        });

        transaction(fundamentals);
    }

    /**
     * Retrieves fundamentals for a specific symbol and period.
     */
    static getFundamentals(symbol: string, period?: string): FundamentalMetric[] {
        const db = getDb();
        let query = 'SELECT * FROM fundamentals WHERE symbol = $symbol';
        const params: any = { $symbol: symbol };

        if (period) {
            query += ' AND period = $period';
            params.$period = period;
        }

        return db.query(query).all(params) as any[];
    }
}
