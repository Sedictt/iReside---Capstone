/**
 * REAL Test script for business verification using Puppeteer
 * This actually opens a browser and scrapes the Valenzuela website
 * 
 * Run with: npx tsx scripts/test-real-scraper.ts
 */

import { scrapeValenzuelaBusinessDatabank, testScraper } from '../src/lib/valenzuela-scraper';

async function main() {
    console.log('🚀 REAL BUSINESS VERIFICATION TEST');
    console.log('This will actually open a browser and search the Valenzuela website!\n');
    
    const businessName = process.argv[2] || 'Jollibee';
    
    console.log('='.repeat(60));
    console.log(`🔍 Searching for: "${businessName}"`);
    console.log('='.repeat(60));
    
    try {
        const result = await scrapeValenzuelaBusinessDatabank(businessName);
        
        console.log('\n📊 RESULT:');
        console.log('-'.repeat(60));
        
        if (result) {
            console.log('✅ REAL DATA FOUND!\n');
            console.log('Business Name:', result.businessName);
            console.log('Address:', result.address);
            console.log('Owner:', result.owner || 'N/A');
            console.log('Permit Number:', result.permitNumber || 'N/A');
            console.log('Business Type:', result.businessType || 'N/A');
            
            if (result.rawText) {
                console.log('\n📝 Raw extracted text:');
                console.log(result.rawText.substring(0, 300) + '...');
            }
        } else {
            console.log('❌ Business not found in Valenzuela records');
        }
        
        console.log('-'.repeat(60));
        
    } catch (error) {
        console.error('\n❌ ERROR:', error);
        console.log('\n💡 Tips:');
        console.log('   - Make sure you have a stable internet connection');
        console.log('   - The Valenzuela website might be down or slow');
        console.log('   - Try running the test again in a few minutes');
        console.log('   - Check if puppeteer is installed: npm list puppeteer');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Test Complete');
    console.log('='.repeat(60));
}

// Run the test
main();

// Example usage:
// npx tsx scripts/test-real-scraper.ts
// npx tsx scripts/test-real-scraper.ts "SM Supermalls"
// npx tsx scripts/test-real-scraper.ts "Puregold"
