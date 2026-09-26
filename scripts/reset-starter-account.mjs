#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

// Load environment variables (.env.local first, fallback to .env)
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
  console.error('Expected NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const clientForAuth = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET = {
  fixedId: '0262272e-33fc-4ec2-98c5-fad3a0900801',
  email: 'practice.landlord1@ireside.ph',
  claimedEmailFallback: 'loststar1033@gmail.com',
  defaultPassword: 'LandlordDemo2026!',
  fullName: 'Practice Landlord 1',
  phone: '0917-111-2222',
  role: 'landlord'
};

const customEmailArg = process.argv.slice(2).find(arg => arg.includes('@'))?.trim().toLowerCase();

async function findTargetUserId() {
  // 1. Check by known fixed ID (Supabase Auth preserves this ID even after email/password changes)
  try {
    const { data: user, error } = await adminClient.auth.admin.getUserById(TARGET.fixedId);
    if (!error && user?.user) {
      return user.user.id;
    }
  } catch (_) {}

  // 2. Fallback: Search by emails or metadata in auth users list
  const { data: listData, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (!listErr && listData?.users) {
    const matched = listData.users.find(u => {
      const email = u.email?.toLowerCase();
      return (
        u.id === TARGET.fixedId ||
        (customEmailArg && email === customEmailArg) ||
        email === TARGET.email.toLowerCase() ||
        email === TARGET.claimedEmailFallback.toLowerCase() ||
        u.user_metadata?.full_name?.toLowerCase() === TARGET.fullName.toLowerCase() ||
        u.user_metadata?.phone === TARGET.phone
      );
    });
    if (matched) return matched.id;
  }

  return TARGET.fixedId;
}

async function cleanStorage(userId, propIds) {
  try {
    const { data: buckets } = await adminClient.storage.listBuckets();
    if (!buckets || buckets.length === 0) return;

    for (const b of buckets) {
      try {
        const { data: rootItems } = await adminClient.storage.from(b.name).list(userId);
        if (rootItems && rootItems.length > 0) {
          for (const item of rootItems) {
            const subPath = `${userId}/${item.name}`;
            const { data: subItems } = await adminClient.storage.from(b.name).list(subPath);
            if (subItems && subItems.length > 0) {
              const filePaths = subItems.map(f => `${subPath}/${f.name}`);
              await adminClient.storage.from(b.name).remove(filePaths);
            }
            await adminClient.storage.from(b.name).remove([subPath]);
          }
          console.log(`  \x1b[32m✓\x1b[0m Cleared storage folder in bucket '${b.name}' for user`);
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('  \x1b[33m!\x1b[0m Storage cleanup warning:', err.message);
  }
}

async function resetStarterAccount() {
  const startTime = Date.now();
  console.log('\n\x1b[1m\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m 🔄 iReside Starter Account Reset (Practice Landlord 1) \x1b[0m');
  console.log('\x1b[1m\x1b[36m====================================================\x1b[0m\n');

  const userId = await findTargetUserId();
  console.log(`Target User ID: \x1b[33m${userId}\x1b[0m`);

  // 1. Identify properties
  const { data: props, error: propFetchErr } = await adminClient
    .from('properties')
    .select('id, name')
    .eq('landlord_id', userId);

  const propIds = (props || []).map(p => p.id);
  if (propIds.length > 0) {
    console.log(`Found ${propIds.length} propert${propIds.length === 1 ? 'y' : 'ies'} created during testing:`);
    props.forEach(p => console.log(`  - "${p.name}" (${p.id})`));

    // Delete storage files
    await cleanStorage(userId, propIds);

    // Clean dependent records in strict relational dependency order
    console.log('Cleaning dependent records for properties...');

    // A. Identify all child units
    const { data: units } = await adminClient
      .from('units')
      .select('id')
      .in('property_id', propIds);
    const unitIds = (units || []).map(u => u.id);

    // B. Identify all child leases (by landlord_id and by unit_id)
    const { data: leasesByLandlord } = await adminClient
      .from('leases')
      .select('id')
      .eq('landlord_id', userId);
    let leaseIds = (leasesByLandlord || []).map(l => l.id);
    if (unitIds.length > 0) {
      const { data: leasesByUnits } = await adminClient
        .from('leases')
        .select('id')
        .in('unit_id', unitIds);
      (leasesByUnits || []).forEach(l => {
        if (!leaseIds.includes(l.id)) leaseIds.push(l.id);
      });
    }

    // C. Identify all payments
    let paymentIds = [];
    if (propIds.length > 0) {
      const { data: pmts } = await adminClient.from('payments').select('id').in('property_id', propIds);
      (pmts || []).forEach(p => paymentIds.push(p.id));
    }
    if (leaseIds.length > 0) {
      const { data: pmts } = await adminClient.from('payments').select('id').in('lease_id', leaseIds);
      (pmts || []).forEach(p => {
        if (!paymentIds.includes(p.id)) paymentIds.push(p.id);
      });
    }

    // 1. Delete payment dependents
    if (paymentIds.length > 0) {
      await adminClient.from('payment_receipts').delete().in('payment_id', paymentIds);
      await adminClient.from('payment_workflow_audit_events').delete().in('payment_id', paymentIds);
      await adminClient.from('payment_items').delete().in('payment_id', paymentIds);
      await adminClient.from('payments').delete().in('id', paymentIds);
    }
    await adminClient.from('payments').delete().eq('landlord_id', userId);

    // 2. Delete lease dependents
    if (leaseIds.length > 0) {
      await adminClient.from('renewal_requests').delete().in('current_lease_id', leaseIds);
      await adminClient.from('renewal_requests').delete().in('new_lease_id', leaseIds);
      await adminClient.from('lease_signing_audit').delete().in('lease_id', leaseIds);
      await adminClient.from('leases').delete().in('id', leaseIds);
    }
    await adminClient.from('renewal_requests').delete().eq('landlord_id', userId);
    await adminClient.from('leases').delete().eq('landlord_id', userId);

    // 3. Delete unit dependents
    if (unitIds.length > 0) {
      await adminClient.from('unit_map_positions').delete().in('unit_id', unitIds);
      await adminClient.from('unit_environment_overrides').delete().in('unit_id', unitIds);
      await adminClient.from('unit_transfer_requests').delete().in('current_unit_id', unitIds);
      await adminClient.from('move_out_requests').delete().in('unit_id', unitIds);
      await adminClient.from('applications').delete().in('unit_id', unitIds);
      await adminClient.from('utility_readings').delete().in('unit_id', unitIds);
      await adminClient.from('maintenance_requests').delete().in('unit_id', unitIds);
      await adminClient.from('tenant_invitations').delete().in('unit_id', unitIds);
    }

    // 4. Delete property dependents
    await adminClient.from('tenant_invitations').delete().in('property_id', propIds);
    await adminClient.from('utility_readings').delete().in('property_id', propIds);
    await adminClient.from('utility_configs').delete().in('property_id', propIds);
    await adminClient.from('property_environment_policies').delete().in('property_id', propIds);
    await adminClient.from('property_floor_configs').delete().in('property_id', propIds);
    await adminClient.from('property_settings').delete().in('property_id', propIds);
    await adminClient.from('property_members').delete().in('property_id', propIds);
    await adminClient.from('amenities').delete().in('property_id', propIds);
    await adminClient.from('expenses').delete().in('property_id', propIds);
    await adminClient.from('applications').delete().in('property_id', propIds);

    const { data: requests } = await adminClient.from('maintenance_requests').select('id').in('property_id', propIds);
    if (requests && requests.length > 0) {
      const reqIds = requests.map(r => r.id);
      await adminClient.from('maintenance_updates').delete().in('maintenance_request_id', reqIds);
    }
    await adminClient.from('maintenance_requests').delete().in('property_id', propIds);

    // 5. Delete units
    if (unitIds.length > 0) {
      const { error: unitDelErr } = await adminClient.from('units').delete().in('property_id', propIds);
      if (unitDelErr) {
        console.warn('  \x1b[33m!\x1b[0m Warning deleting units:', unitDelErr.message);
      }
    }

    // 6. Delete properties
    const { error: delErr } = await adminClient.from('properties').delete().in('id', propIds);
    if (delErr) {
      console.warn('  \x1b[33m!\x1b[0m Warning deleting properties:', delErr.message);
    } else {
      console.log('  \x1b[32m✓\x1b[0m Deleted properties, units, and all dependent records');
    }
  } else {
    console.log('  \x1b[32m✓\x1b[0m No properties to clean up');
    await cleanStorage(userId, []);
  }

  // 2. User-specific table cleanups
  await adminClient.from('user_security_settings').delete().eq('profile_id', userId);
  await adminClient.from('landlord_business_profiles').delete().eq('profile_id', userId);
  await adminClient.from('notifications').delete().eq('user_id', userId);
  await adminClient.from('announcements').delete().eq('landlord_id', userId);
  await adminClient.from('landlord_reviews').delete().eq('landlord_id', userId);
  await adminClient.from('landlord_payment_destinations').delete().eq('landlord_id', userId);
  await adminClient.from('landlord_statistics_exports').delete().eq('landlord_id', userId);
  await adminClient.from('landlord_inquiry_actions').delete().eq('landlord_id', userId);
  console.log('  \x1b[32m✓\x1b[0m Cleared security settings, business profiles, and notifications');

  // 3. Reset public.profiles
  const profileReset = {
    email: TARGET.email,
    full_name: TARGET.fullName,
    role: TARGET.role,
    phone: TARGET.phone,
    business_name: null,
    avatar_url: null,
    avatar_bg_color: '#171717',
    bio: null,
    website: null,
    address: null,
    cover_url: null,
    socials: {},
    business_permits: [],
    business_permit_url: null,
    business_permit_number: null,
    two_factor_enabled: false,
    two_factor_email: null,
    gmail_access_token: null,
    gmail_refresh_token: null,
    gmail_token_expiry: null,
    otp_code: null,
    otp_expiry: null,
    has_changed_password: false,
    updated_at: new Date().toISOString()
  };

  const { error: profErr } = await adminClient
    .from('profiles')
    .update(profileReset)
    .eq('id', userId);

  if (profErr) {
    console.error('  \x1b[31m✗\x1b[0m Error resetting profile:', profErr.message);
  } else {
    console.log('  \x1b[32m✓\x1b[0m Reset public.profiles record back to fresh defaults');
  }

  // 4. Reset Supabase Auth User (Email, Password, Metadata, Verification)
  const { data: authUpdated, error: authErr } = await adminClient.auth.admin.updateUserById(userId, {
    email: TARGET.email,
    password: TARGET.defaultPassword,
    email_confirm: true,
    user_metadata: {
      email_verified: true,
      full_name: TARGET.fullName,
      phone: TARGET.phone,
      role: TARGET.role,
      is_account_claimed: false,
      is_setup_completed: false
    }
  });

  if (authErr) {
    console.error('  \x1b[31m✗\x1b[0m Error updating Auth credentials:', authErr.message);
    process.exit(1);
  } else {
    console.log(`  \x1b[32m✓\x1b[0m Reset Auth credentials to \x1b[32m${TARGET.email}\x1b[0m (Password: \x1b[33m${TARGET.defaultPassword}\x1b[0m)`);
  }

  // 5. Test sign-in to guarantee readiness
  console.log('\nTesting login with reset credentials...');
  const { data: testAuth, error: testErr } = await clientForAuth.auth.signInWithPassword({
    email: TARGET.email,
    password: TARGET.defaultPassword,
  });

  if (testErr) {
    console.error(`  \x1b[31m✗ Login verification failed:\x1b[0m ${testErr.message}`);
    process.exit(1);
  } else {
    console.log(`  \x1b[32m✓ Login verified successfully!\x1b[0m`);
    console.log(`    - User: ${testAuth.user.email}`);
    console.log(`    - Role: ${testAuth.user.user_metadata?.role}`);
    console.log(`    - Claim Status: ${testAuth.user.user_metadata?.is_account_claimed ? 'Claimed' : 'Unclaimed (Ready for Onboarding)'}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n\x1b[1m\x1b[32m====================================================\x1b[0m');
  console.log(`\x1b[1m\x1b[32m ✨ Account is fresh and ready to test! (${elapsed}s) \x1b[0m`);
  console.log('\x1b[1m\x1b[32m====================================================\x1b[0m');
  console.log(`\n  \x1b[1mEmail:\x1b[0m    ${TARGET.email}`);
  console.log(`  \x1b[1mPassword:\x1b[0m ${TARGET.defaultPassword}\n`);
}

resetStarterAccount().catch((err) => {
  console.error('\x1b[31mUnexpected error during reset:\x1b[0m', err);
  process.exit(1);
});
