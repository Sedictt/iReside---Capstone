/**
 * Quick setup verification script
 * Run this to confirm everything is configured correctly
 * 
 * npx tsx scripts/verify-setup.ts
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 SETUP VERIFICATION\n');
console.log('='.repeat(60));

const checks = [
    {
        name: 'Puppeteer installed',
        check: () => {
            try {
                require.resolve('puppeteer');
                return true;
            } catch {
                return false;
            }
        },
        fix: 'npm install puppeteer'
    },
    {
        name: 'Real scraper file exists',
        check: () => fs.existsSync(path.join(__dirname, '../src/lib/valenzuela-scraper.ts')),
        fix: 'Check if src/lib/valenzuela-scraper.ts exists'
    },
    {
        name: 'Test script exists',
        check: () => fs.existsSync(path.join(__dirname, 'test-real-scraper.ts')),
        fix: 'Check if scripts/test-real-scraper.ts exists'
    },
    {
        name: 'API route exists',
        check: () => fs.existsSync(path.join(__dirname, '../src/app/api/admin/registrations/test-verify/route.ts')),
        fix: 'Check if API routes are set up'
    },
    {
        name: 'Test page exists',
        check: () => fs.existsSync(path.join(__dirname, '../src/app/admin/test-verification/page.tsx')),
        fix: 'Check if test page exists'
    },
    {
        name: 'Database migration exists',
        check: () => fs.existsSync(path.join(__dirname, '../supabase/migrations/20260408_business_verification.sql')),
        fix: 'Check if migration file exists'
    },
];

let allPassed = true;

for (const check of checks) {
    const passed = check.check();
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    if (!passed) {
        console.log(`   Fix: ${check.fix}`);
        allPassed = false;
    }
}

console.log('='.repeat(60));

if (allPassed) {
    console.log('\n🎉 ALL CHECKS PASSED!');
    console.log('\nNext steps:');
    console.log('1. Run the real test: npx tsx scripts/test-real-scraper.ts "Jollibee"');
    console.log('2. Start dev server: npm run dev');
    console.log('3. Visit: http://localhost:3000/admin/test-verification');
    console.log('\n⚠️  Note: First test may take 20-30 seconds as browser launches');
} else {
    console.log('\n⚠️  SOME CHECKS FAILED');
    console.log('Please fix the issues above before testing.');
}

console.log('\n' + '='.repeat(60));
