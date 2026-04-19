/**
 * Test the real Puppeteer scraper against the Valenzuela website.
 * Run with: npx tsx scripts/test-real-scraper.ts [business name]
 */

import { scrapeValenzuelaBusinessDatabank } from '../src/lib/valenzuela-scraper';

async function main() {
    const businessName = process.argv[2] || 'JOEL G.';

    console.log('='.repeat(60));
    console.log(`🔍 Searching for: "${businessName}"`);
    console.log('='.repeat(60));

    try {
        const { rows } = await scrapeValenzuelaBusinessDatabank(businessName);

        console.log(`\n✅ Found ${rows.length} result(s):\n`);
        rows.forEach((row, i) => {
            console.log(`  ${i + 1}. ${row.businessName}`);
            console.log(`     District: ${row.district} | Barangay: ${row.barangay}`);
            console.log(`     Industry: ${row.industry}\n`);
        });

        if (rows.length === 0) {
            console.log('❌ No businesses found.');
        }
    } catch (error) {
        console.error('\n❌ ERROR:', error);
    }

    console.log('='.repeat(60));
    console.log('🏁 Done');
}

main();
