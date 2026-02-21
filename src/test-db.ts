import { PriceRepository } from './db/repositories/price-repo.js';
import { initDb } from './db/client.js';

async function test() {
    console.log('Testing Database Persistence...');
    try {
        initDb();

        const dummyPrices = [
            { symbol: 'TEST_STOCK', open: 10, high: 12, low: 9, close: 11, change: 1, percentChange: 10 }
        ];

        console.log('Saving dummy price...');
        PriceRepository.savePrices(dummyPrices);

        console.log('Retrieving cached price...');
        const cached = PriceRepository.getLatestPrice('TEST_STOCK');
        console.log('Retrieved:', cached);

        if (cached && cached.symbol === 'TEST_STOCK') {
            console.log('✅ Persistence check passed!');
        } else {
            console.log('❌ Persistence check failed!');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
