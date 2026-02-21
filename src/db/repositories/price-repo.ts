import { getDb } from '../client.js';
import { NgxPrice } from '../../tools/ngx/prices.js';

export class PriceRepository {
    /**
     * Saves a list of prices to the database.
     */
    static savePrices(prices: NgxPrice[]) {
        const db = getDb();
        const timestamp = Date.now();

        const insert = db.prepare(`
      INSERT OR REPLACE INTO prices (symbol, open, high, low, close, price_change, timestamp)
      VALUES ($symbol, $open, $high, $low, $close, $change, $timestamp)
    `);

        const transaction = db.transaction((priceList: NgxPrice[]) => {
            for (const price of priceList) {
                insert.run({
                    $symbol: price.symbol,
                    $open: price.open,
                    $high: price.high,
                    $low: price.low,
                    $close: price.close,
                    $change: price.change,
                    $timestamp: timestamp
                });
            }
        });

        transaction(prices);
    }

    /**
     * Gets the latest price for a specific symbol.
     */
    static getLatestPrice(symbol: string): any {
        const db = getDb();
        return db.query('SELECT * FROM prices WHERE symbol = $symbol ORDER BY timestamp DESC LIMIT 1')
            .get({ $symbol: symbol });
    }

    /**
     * Gets all latest prices (most recent snapshot).
     */
    static getAllLatestPrices(): any[] {
        const db = getDb();
        // Use a subquery to get the latest timestamp available across all symbols
        // or group by symbol and pick the max timestamp.
        return db.query(`
      SELECT p.* FROM prices p
      INNER JOIN (
        SELECT symbol, MAX(timestamp) as max_ts FROM prices GROUP BY symbol
      ) m ON p.symbol = m.symbol AND p.timestamp = m.max_ts
    `).all();
    }
}
