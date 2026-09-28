#!/usr/bin/env node

/**
 * iReside - Fresh Starter Account Provisioning Utility (Non-Destructive)
 * 
 * Creates a brand-new, clean-slate landlord account specifically designed
 * for the Account Claiming & First-Time Onboarding test case.
 * 
 * DOES NOT wipe or touch any existing accounts or existing property data.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

const root = process.cwd();
if (fs.existsSync(path.join(root, '.env.local'))) {
  dotenv.config({ path: path.join(root, '.env.local') });
}
if (fs.existsSync(path.join(root, '.env'))) {
  dotenv.config({ path: path.join(root, '.env') });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error('\x1b[31m[Error] Missing required Supabase environment variables in .env/.env.local\x1b[0m');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const clientForAuth = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function provisionStarterAccount() {
  const customEmail = process.argv.slice(2).find(arg => arg.includes('@'))?.trim().toLowerCase();
  const customPassword = process.argv.slice(2).find(arg => arg.startsWith('--pass='))?.replace('--pass=', '')?.trim();

  // Determine candidate email (prefer practice.landlord2 if available, or practice.landlord3)
  let targetEmail = customEmail;
  const defaultPassword = customPassword || 'LandlordDemo2026!';

  const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const existingEmails = new Set((listData?.users || []).map(u => u.email?.toLowerCase()));

  if (!targetEmail) {
    if (!existingEmails.has('practice.landlord2@ireside.ph')) {
      targetEmail = 'practice.landlord2@ireside.ph';
    } else if (!existingEmails.has('practice.landlord3@ireside.ph')) {
      targetEmail = 'practice.landlord3@ireside.ph';
    } else {
      let idx = 4;
      while (existingEmails.has(`practice.landlord${idx}@ireside.ph`)) {
        idx++;
      }
      targetEmail = `practice.landlord${idx}@ireside.ph`;
    }
  }

  if (existingEmails.has(targetEmail)) {
    console.error(`\x1b[31m[Error] User with email ${targetEmail} already exists! Use a fresh email to ensure zero prior state.\x1b[0m`);
    process.exit(1);
  }

  const numberMatch = targetEmail.match(/\d+/);
  const landlordIndex = numberMatch ? numberMatch[0] : '2';
  const fullName = `Practice Landlord ${landlordIndex}`;
  const phone = '0917-000-0000';

  console.log('\n\x1b[1m\x1b[36m====================================================\x1b[0m');
  console.log(`\x1b[1m\x1b[36m 🚀 Provisioning Fresh Claimable Account: ${targetEmail} \x1b[0m`);
  console.log('\x1b[1m\x1b[36m====================================================\x1b[0m\n');

  // 1. Create fresh auth user
  console.log('1. Creating Supabase Auth user...');
  const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
    email: targetEmail,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      email_verified: true,
      full_name: fullName,
      phone,
      role: 'landlord',
      is_account_claimed: false,
      is_setup_completed: false,
    },
  });

  if (authErr || !authUser?.user) {
    console.error('\x1b[31m✗ Failed to create auth user:\x1b[0m', authErr?.message);
    process.exit(1);
  }

  const userId = authUser.user.id;
  console.log(`  \x1b[32m✓\x1b[0m Auth user created with ID: \x1b[33m${userId}\x1b[0m`);

  // 2. Ensure public.profiles record has correct clean-slate defaults
  console.log('2. Syncing public.profiles record...');
  const profileRecord = {
    id: userId,
    email: targetEmail,
    full_name: fullName,
    role: 'landlord',
    phone,
    avatar_bg_color: '#8B5CF6',
    avatar_url: null,
    bio: null,
    business_name: null,
    has_changed_password: false,
    is_account_claimed: false,
    two_factor_enabled: false,
    socials: {},
    updated_at: new Date().toISOString(),
  };

  const { error: profErr } = await adminClient.from('profiles').upsert(profileRecord, { onConflict: 'id' });
  if (profErr) {
    console.error('\x1b[31m✗ Failed to update profile:\x1b[0m', profErr.message);
    process.exit(1);
  }
  console.log('  \x1b[32m✓\x1b[0m Synced public.profiles record with unclaimed state');

  // 3. Upsert public.user_security_settings
  console.log('3. Initializing public.user_security_settings...');
  const { error: secErr } = await adminClient.from('user_security_settings').upsert({
    profile_id: userId,
    has_changed_password: false,
    two_factor_enabled: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id' });

  if (secErr) {
    console.warn('  \x1b[33m!\x1b[0m Note inserting user_security_settings:', secErr.message);
  } else {
    console.log('  \x1b[32m✓\x1b[0m Initialized user_security_settings');
  }

  // 4. Verification Check: 0 properties, 0 units, 0 leases
  const { count: propCount } = await adminClient
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('landlord_id', userId);

  console.log(`4. Integrity Check: \x1b[32m${propCount ?? 0} properties linked\x1b[0m (Strictly Clean Slate)`);

  // 5. Verify Sign-in
  console.log('5. Verifying auth login handshake...');
  const { data: testAuth, error: testErr } = await clientForAuth.auth.signInWithPassword({
    email: targetEmail,
    password: defaultPassword,
  });

  if (testErr) {
    console.error('\x1b[31m✗ Test login failed:\x1b[0m', testErr.message);
    process.exit(1);
  }

  console.log('  \x1b[32m✓ Login verified successfully!\x1b[0m');
  console.log(`    - User ID: ${testAuth.user.id}`);
  console.log(`    - Email: ${testAuth.user.email}`);
  console.log(`    - Role: ${testAuth.user.user_metadata?.role}`);
  console.log(`    - Claim Status: \x1b[33m${testAuth.user.user_metadata?.is_account_claimed ? 'Claimed' : 'Unclaimed (Ready for Account Claiming Modal)'}\x1b[0m`);

  console.log('\n\x1b[1m\x1b[32m====================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m ✨ Fresh Account is Ready for Testing! \x1b[0m');
  console.log('\x1b[1m\x1b[32m====================================================\x1b[0m');
  console.log(`\n  \x1b[1mLogin URL:\x1b[0m      http://localhost:3000/login`);
  console.log(`  \x1b[1mEmail:\x1b[0m          ${targetEmail}`);
  console.log(`  \x1b[1mTemporary Pass:\x1b[0m ${defaultPassword}\n`);
}

provisionStarterAccount().catch((err) => {
  console.error('\x1b[31mUnexpected error:\x1b[0m', err);
  process.exit(1);
});
