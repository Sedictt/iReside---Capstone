/**
 * Test script for business verification feature
 * Run with: npx tsx scripts/test-business-verification.ts
 */

import { searchValenzuelaBusinessDatabank, generateValenzuelaSearchURL } from '../src/lib/business-verification';

async function testBusinessVerification() {
    console.log('🧪 Testing Business Verification Feature\n');
    console.log('='.repeat(50));

    const testCases = [
        { name: 'JOEL G.', description: 'Partial name — should list VLINK rows' },
        { name: 'Jollibee', description: 'Known brand' },
        { name: 'Fake Business 12345', description: 'Non-existent business' },
    ];

    for (const testCase of testCases) {
        console.log(`\n📋 Test: ${testCase.description}`);
        console.log(`   Business: ${testCase.name}`);

        try {
            const result = await searchValenzuelaBusinessDatabank(testCase.name);
            console.log(`   Status: ${result.status}`);
            console.log(`   Rows returned: ${result.rows.length}`);
            result.rows.slice(0, 3).forEach((row, i) => {
                console.log(`     ${i + 1}. ${row.businessName} | ${row.district} | ${row.barangay} | ${row.industry}`);
            });

            const manualURL = generateValenzuelaSearchURL(testCase.name);
            console.log(`   Manual URL: ${manualURL}`);
        } catch (error) {
            console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🏁 Testing Complete\n');
}

testBusinessVerification().catch(console.error);
