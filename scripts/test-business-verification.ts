/**
 * Test script for business verification feature
 * 
 * Run with: npx tsx scripts/test-business-verification.ts
 * Or: node --loader ts-node/esm scripts/test-business-verification.ts
 */

import { searchValenzuelaBusinessDatabank, generateValenzuelaSearchURL } from '../src/lib/business-verification';

async function testBusinessVerification() {
    console.log('🧪 Testing Business Verification Feature\n');
    console.log('=' .repeat(50));

    const testCases = [
        {
            name: 'Jollibee',
            address: '',
            expected: 'verified',
            description: 'Known business in Valenzuela'
        },
        {
            name: 'SM Supermalls',
            address: 'Valenzuela',
            expected: 'verified',
            description: 'Known business with address'
        },
        {
            name: 'Fake Business 12345',
            address: '',
            expected: 'not_found',
            description: 'Non-existent business'
        },
        {
            name: 'Test Company XYZ',
            address: '',
            expected: 'not_found',
            description: 'Unknown business'
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n📋 Test: ${testCase.description}`);
        console.log(`   Business: ${testCase.name}`);
        console.log(`   Address: ${testCase.address || '(none)'}`);
        console.log(`   Expected: ${testCase.expected}`);
        console.log('   Testing...\n');

        try {
            const result = await searchValenzuelaBusinessDatabank(testCase.name, testCase.address);
            
            console.log('   ✅ Result received:');
            console.log(`      Status: ${result.status}`);
            console.log(`      Source: ${result.source}`);
            console.log(`      Checked At: ${result.checkedAt}`);
            
            if (result.data) {
                console.log('      Business Data:');
                console.log(`         - Name: ${result.data.businessName || 'N/A'}`);
                console.log(`         - Address: ${result.data.address || 'N/A'}`);
                console.log(`         - Owner: ${result.data.owner || 'N/A'}`);
                console.log(`         - Permit: ${result.data.permitNumber || 'N/A'}`);
            }
            
            if (result.error) {
                console.log(`      Error: ${result.error}`);
            }
            
            // Generate manual search URL
            const manualURL = generateValenzuelaSearchURL(testCase.name, testCase.address);
            console.log(`      Manual Search URL: ${manualURL}`);
            
            // Verify against expected
            const passed = result.status === testCase.expected;
            console.log(`\n   ${passed ? '✅ PASS' : '❌ FAIL'} (expected: ${testCase.expected}, got: ${result.status})`);
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🏁 Testing Complete\n');
}

// Run tests
testBusinessVerification().catch(console.error);
