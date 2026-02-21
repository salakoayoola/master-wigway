import { fetchNgxPrices } from './tools/ngx/prices.js';

async function test() {
    console.log('Testing NGX Price Scraper...');
    try {
        const prices = await fetchNgxPrices();
        console.log(`Successfully fetched ${prices.length} prices.`);

        // Show top 5
        console.table(prices.slice(0, 5));

        // Find a specific one
        const zenith = prices.find(p => p.symbol === 'ZENITHBANK');
        if (zenith) {
            console.log('Zenith Bank details:', zenith);
        } else {
            console.log('ZENITHBANK not found in the list.');
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
