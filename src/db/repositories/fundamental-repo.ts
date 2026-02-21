import { getDb } from '../client.js';

export interface FundamentalMetric {
    symbol: string;
    metric: string;
    value: string;
    period: string;
}

export interface AnnualFinancial {
    ticker: string;
    year: number;
    metric: string;
    value: string;
}

export interface QuarterlyFinancial {
    ticker: string;
    quarter: string;
    year: number;
    metric: string;
    value: string;
}

export interface Company {
    ticker: string;
    name: string;
    sector: string;
}

export class FundamentalRepository {
    // -----------------------------------------------------------------------
    // Legacy fundamentals table (backward compatible)
    // -----------------------------------------------------------------------

    /**
     * Saves extracted fundamentals to the legacy table.
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

    // -----------------------------------------------------------------------
    // Companies table
    // -----------------------------------------------------------------------

    /**
     * Saves or updates a company record.
     */
    static async saveCompany(company: Company) {
        const db = await getDb();
        await db.run(
            `INSERT OR REPLACE INTO companies (ticker, name, sector, created_at)
             VALUES (?, ?, ?, ?)`,
            company.ticker,
            company.name,
            company.sector,
            Date.now()
        );
    }

    /**
     * Retrieves a company by ticker.
     */
    static async getCompany(ticker: string): Promise<Company | null> {
        const db = await getDb();
        const row = await db.get(
            'SELECT ticker, name, sector FROM companies WHERE ticker = ?',
            ticker
        );
        return (row as Company) ?? null;
    }

    // -----------------------------------------------------------------------
    // Annual financials table
    // -----------------------------------------------------------------------

    /**
     * Saves annual financial metrics.
     */
    static async saveAnnualFinancials(records: AnnualFinancial[]) {
        const db = await getDb();
        const timestamp = Date.now();

        await db.exec('BEGIN TRANSACTION');
        try {
            const stmt = await db.prepare(`
        INSERT OR REPLACE INTO annual_financials (ticker, year, metric, value, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);

            for (const item of records) {
                await stmt.run(item.ticker, item.year, item.metric, item.value, timestamp);
            }
            await stmt.finalize();
            await db.exec('COMMIT');
        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }
    }

    /**
     * Retrieves annual financials for a ticker, optionally filtered by year.
     */
    static async getAnnualFinancials(ticker: string, year?: number): Promise<AnnualFinancial[]> {
        const db = await getDb();
        let query = 'SELECT ticker, year, metric, value FROM annual_financials WHERE ticker = ?';
        const params: any[] = [ticker];

        if (year) {
            query += ' AND year = ?';
            params.push(year);
        }

        query += ' ORDER BY year DESC, metric ASC';
        const rows = await db.all(query, ...params);
        return rows as AnnualFinancial[];
    }

    // -----------------------------------------------------------------------
    // Quarterly financials table
    // -----------------------------------------------------------------------

    /**
     * Saves quarterly financial metrics.
     */
    static async saveQuarterlyFinancials(records: QuarterlyFinancial[]) {
        const db = await getDb();
        const timestamp = Date.now();

        await db.exec('BEGIN TRANSACTION');
        try {
            const stmt = await db.prepare(`
        INSERT OR REPLACE INTO quarterly_financials (ticker, quarter, year, metric, value, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

            for (const item of records) {
                await stmt.run(item.ticker, item.quarter, item.year, item.metric, item.value, timestamp);
            }
            await stmt.finalize();
            await db.exec('COMMIT');
        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }
    }

    /**
     * Retrieves quarterly financials for a ticker, optionally filtered by quarter and year.
     */
    static async getQuarterlyFinancials(
        ticker: string,
        quarter?: string,
        year?: number
    ): Promise<QuarterlyFinancial[]> {
        const db = await getDb();
        let query = 'SELECT ticker, quarter, year, metric, value FROM quarterly_financials WHERE ticker = ?';
        const params: any[] = [ticker];

        if (quarter) {
            query += ' AND quarter = ?';
            params.push(quarter);
        }
        if (year) {
            query += ' AND year = ?';
            params.push(year);
        }

        query += ' ORDER BY year DESC, quarter DESC, metric ASC';
        const rows = await db.all(query, ...params);
        return rows as QuarterlyFinancial[];
    }

    /**
     * Lists all tickers with stored annual data.
     */
    static async listTickers(): Promise<string[]> {
        const db = await getDb();
        const rows = await db.all('SELECT DISTINCT ticker FROM annual_financials ORDER BY ticker');
        return (rows as Array<{ ticker: string }>).map((r) => r.ticker);
    }

    /**
     * Lists all available years for a ticker.
     */
    static async listYears(ticker: string): Promise<number[]> {
        const db = await getDb();
        const rows = await db.all(
            'SELECT DISTINCT year FROM annual_financials WHERE ticker = ? ORDER BY year DESC',
            ticker
        );
        return (rows as Array<{ year: number }>).map((r) => r.year);
    }
}
