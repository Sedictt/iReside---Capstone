#!/usr/bin/env node

/**
 * iReside - Test Tenant Account Provisioning Utility (Non-Destructive)
 * 
 * Generates fresh, fully configured tenant accounts ready to execute
 * all 14 tenant test cases (TC-TO-048 through TC-TA-061).
 * 
 * Features:
 * - Auto-detects the next available email (practice.tenant1, practice.tenant2, practice.tenant3, etc.)
 *   or accepts a custom email argument.
 * - Allocates an available unit in Skyline Lofts (or dynamically creates one if full).
 * - Generates an active lease with signatures and an active renewal window (<= 90 days remaining).
 * - Seeds an itemized monthly bill (Rent, Electricity with meter readings, Water with meter readings).
 * - Seeds an active maintenance ticket with an assigned technician (Mario Rossi).
 * - Seeds building announcement notifications.
 * - Sets up a direct chat conversation with landlord Roberto Reyes.
 * - Verifies credentials via Supabase Auth handshake.
 * 
 * Usage:
 *   node scripts/create-test-tenant-account.mjs
 *   node scripts/create-test-tenant-account.mjs custom.tenant@example.ph
 *   node scripts/create-test-tenant-account.mjs --pass=CustomPass123! --name="Maria Santos"
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

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
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const clientForAuth = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const LANDLORD_ID = '11111111-1111-1111-1111-111111111111'; // Roberto Reyes
const PROPERTY_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'; // Skyline Lofts
const RESERVED_INVITE_UNIT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb63'; // Villa 105 (reserved for /apply/[token] testing)

function hashInviteToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function provisionTenantAccount() {
  const args = process.argv.slice(2);
  const customEmail = args.find(arg => arg.includes('@'))?.trim().toLowerCase();
  const customPassword = args.find(arg => arg.startsWith('--pass='))?.replace('--pass=', '')?.trim();
  const customName = args.find(arg => arg.startsWith('--name='))?.replace('--name=', '')?.trim();
  const requestedUnitName = args.find(arg => arg.startsWith('--unit='))?.replace('--unit=', '')?.trim();

  // 1. Determine candidate email
  const { data: listData, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error('\x1b[31m[Error] Failed to list auth users:\x1b[0m', listErr.message);
    process.exit(1);
  }

  const existingEmails = new Set((listData?.users || []).map(u => u.email?.toLowerCase()));

  let targetEmail = customEmail;
  if (!targetEmail) {
    let idx = 1;
    while (existingEmails.has(`practice.tenant${idx}@ireside.ph`)) {
      idx++;
    }
    targetEmail = `practice.tenant${idx}@ireside.ph`;
  }

  if (existingEmails.has(targetEmail)) {
    console.error(`\x1b[31m[Error] User with email ${targetEmail} already exists! Use a fresh email or delete the existing account.\x1b[0m`);
    process.exit(1);
  }

  const numberMatch = targetEmail.match(/\d+/);
  const tenantIndex = numberMatch ? numberMatch[0] : Math.floor(Math.random() * 900 + 100).toString();
  const fullName = customName || `Practice Resident ${tenantIndex}`;
  const phone = `0918-${tenantIndex.padStart(3, '0')}-7890`;
  const defaultPassword = customPassword || 'TenantDemo2026!';

  console.log('\n\x1b[1m\x1b[36m====================================================\x1b[0m');
  console.log(`\x1b[1m\x1b[36m 🏢 Provisioning Fresh Tenant Account: ${targetEmail} \x1b[0m`);
  console.log('\x1b[1m\x1b[36m====================================================\x1b[0m\n');

  // 2. Select or create an appropriate unit in Skyline Lofts
  console.log('1. Allocating residential unit...');
  const { data: units } = await adminClient
    .from('units')
    .select('id, name, floor, status, rent_amount')
    .eq('property_id', PROPERTY_ID)
    .neq('id', RESERVED_INVITE_UNIT);

  let targetUnit = null;
  if (requestedUnitName && units) {
    targetUnit = units.find(u => u.name.toLowerCase() === requestedUnitName.toLowerCase());
  }

  if (!targetUnit && units) {
    // Prefer vacant unit
    targetUnit = units.find(u => u.status === 'vacant');
    if (!targetUnit) {
      // Or find unit without active lease
      const { data: activeLeases } = await adminClient
        .from('leases')
        .select('unit_id')
        .eq('status', 'active');
      const leasedUnitIds = new Set((activeLeases || []).map(l => l.unit_id));
      targetUnit = units.find(u => !leasedUnitIds.has(u.id));
    }
  }

  // If no unit is available, create a fresh one dynamically
  if (!targetUnit) {
    const existingUnitCount = units?.length || 10;
    const newUnitNumber = `Villa ${200 + existingUnitCount + 1}`;
    const { data: createdUnit, error: createUnitErr } = await adminClient.from('units').insert({
      property_id: PROPERTY_ID,
      name: newUnitNumber,
      floor: 2,
      status: 'occupied',
      rent_amount: 15000,
      sqft: 550,
      beds: 2,
      baths: 1,
    }).select('id, name, floor, rent_amount').single();

    if (createUnitErr || !createdUnit) {
      console.error('Failed to create new unit:', createUnitErr?.message);
      process.exit(1);
    }
    targetUnit = createdUnit;
    console.log(`  \x1b[32m✓\x1b[0m Created new unit: \x1b[33m${targetUnit.name}\x1b[0m in Skyline Lofts`);
  } else {
    await adminClient.from('units').update({ status: 'occupied' }).eq('id', targetUnit.id);
    console.log(`  \x1b[32m✓\x1b[0m Assigned unit: \x1b[33m${targetUnit.name}\x1b[0m (ID: ${targetUnit.id})`);
  }

  const avatarIndex = (Math.abs(parseInt(tenantIndex, 10) || 5) % 16) + 3;
  const systemAvatarUrl = `https://hlpgsiqyrtndqdgvttcr.supabase.co/storage/v1/object/public/profile-avatars/default_avatars/${avatarIndex}.png`;

  // 3. Create Supabase Auth User
  console.log('2. Creating Supabase Auth user...');
  const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
    email: targetEmail,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      email_verified: true,
      full_name: fullName,
      phone,
      role: 'tenant',
      is_account_claimed: true,
      avatar_url: systemAvatarUrl,
    },
  });

  if (authErr || !authUser?.user) {
    console.error('\x1b[31m✗ Failed to create auth user:\x1b[0m', authErr?.message);
    process.exit(1);
  }

  const userId = authUser.user.id;
  console.log(`  \x1b[32m✓\x1b[0m Auth user created with ID: \x1b[33m${userId}\x1b[0m`);

  // 4. Upsert public.profiles record
  console.log('3. Syncing public.profiles record...');
  const { error: profErr } = await adminClient.from('profiles').upsert({
    id: userId,
    email: targetEmail,
    full_name: fullName,
    phone,
    role: 'tenant',
    avatar_bg_color: '#8B5CF6',
    avatar_url: systemAvatarUrl,
    has_changed_password: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (profErr) {
    console.error('\x1b[31m✗ Failed to create profile:\x1b[0m', profErr.message);
    process.exit(1);
  }
  console.log('  \x1b[32m✓\x1b[0m Synced public.profiles');

  // 5. Create Active Lease with Renewal Eligibility (<= 90 days remaining)
  console.log('4. Creating active lease agreement...');
  const now = new Date();
  const leaseStartDate = '2026-01-01';
  // End date set to roughly 63 days in the future (Nov 30, 2026) so renewal is active
  const leaseEndDate = '2026-11-30';
  const leaseId = crypto.randomUUID();
  const monthlyRent = Number(targetUnit.rent_amount) || 15000;

  const { error: leaseErr } = await adminClient.from('leases').insert({
    id: leaseId,
    unit_id: targetUnit.id,
    tenant_id: userId,
    landlord_id: LANDLORD_ID,
    status: 'active',
    start_date: leaseStartDate,
    end_date: leaseEndDate,
    monthly_rent: monthlyRent,
    security_deposit: monthlyRent,
    terms: {
      due_day: 5,
      late_fee: 500,
      allow_partial: true,
      house_rules: [
        'Quiet hours from 10:00 PM to 7:00 AM daily',
        'No smoking inside residential units or hallways',
        'Visitor registration required at the lobby front desk',
        'Garbage segregation strictly enforced',
      ],
    },
    tenant_signature: fullName,
    landlord_signature: 'Roberto Reyes',
    signed_at: '2025-12-28T09:30:00Z',
    tenant_signed_at: '2025-12-28T09:30:00Z',
    landlord_signed_at: '2025-12-28T10:00:00Z',
    signing_mode: 'in_person',
  });

  if (leaseErr) {
    console.error('\x1b[31m✗ Failed to create lease:\x1b[0m', leaseErr.message);
    process.exit(1);
  }
  console.log(`  \x1b[32m✓\x1b[0m Active lease registered (Rent: ₱${monthlyRent.toLocaleString()}/mo, Renewal window active)`);

  // 6. Generate Pending Itemized Bill (TC-TP-057 & TC-TP-058)
  console.log('5. Generating itemized statement of account...');
  const paymentId = crypto.randomUUID();
  const electricAmount = 1850;
  const waterAmount = 620;
  const totalBillAmount = monthlyRent + electricAmount + waterAmount;
  const invoiceNumber = `INV-${now.getFullYear()}-10-${tenantIndex.padStart(4, '0')}`;

  const { error: pmtErr } = await adminClient.from('payments').insert({
    id: paymentId,
    lease_id: leaseId,
    tenant_id: userId,
    landlord_id: LANDLORD_ID,
    amount: totalBillAmount,
    subtotal: totalBillAmount,
    balance_remaining: totalBillAmount,
    paid_amount: 0,
    status: 'pending',
    workflow_status: 'pending',
    description: 'October 2026 - Monthly Rent & Utility Consumption',
    due_date: '2026-10-05T23:59:59Z',
    invoice_number: invoiceNumber,
    billing_cycle: '2026-10-01',
    invoice_period_start: '2026-10-01',
    invoice_period_end: '2026-10-31',
    allow_partial_payments: true,
  });

  if (!pmtErr) {
    await adminClient.from('payment_items').insert([
      {
        payment_id: paymentId,
        label: 'Base Monthly Rent',
        amount: monthlyRent,
        category: 'rent',
        sort_order: 1,
        metadata: {},
      },
      {
        payment_id: paymentId,
        label: `Electricity Consumption (Meter #EM-9${tenantIndex})`,
        amount: electricAmount,
        category: 'electricity',
        sort_order: 2,
        metadata: {
          meter_number: `EM-9${tenantIndex}`,
          previous_reading: 1420,
          current_reading: 1568,
          consumption: 148,
          rate_per_kwh: 12.50,
        },
      },
      {
        payment_id: paymentId,
        label: `Water Consumption (Meter #WM-5${tenantIndex})`,
        amount: waterAmount,
        category: 'water',
        sort_order: 3,
        metadata: {
          meter_number: `WM-5${tenantIndex}`,
          previous_reading: 310,
          current_reading: 325.5,
          consumption: 15.5,
          rate_per_cbm: 40.00,
        },
      },
    ]);
    console.log(`  \x1b[32m✓\x1b[0m Generated bill ₱${totalBillAmount.toLocaleString()} with electric & water meter readings`);
  }

  // 7. Seed Active Maintenance Ticket (TC-TE-056)
  console.log('6. Seeding active repair ticket...');
  const maintId = crypto.randomUUID();
  await adminClient.from('maintenance_requests').insert({
    id: maintId,
    unit_id: targetUnit.id,
    tenant_id: userId,
    landlord_id: LANDLORD_ID,
    title: 'Leaking bathroom sink drainage pipe',
    description: 'The PVC P-trap pipe under the bathroom sink is leaking water continuously whenever the faucet is turned on. Requires collar replacement.',
    category: 'plumbing',
    priority: 'high',
    status: 'in_progress',
    repair_method: 'third_party',
    third_party_name: 'Mario Rossi (Master Plumber - PipeWorks PH)',
    images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'],
    tenant_repair_status: 'repairing',
  });
  console.log('  \x1b[32m✓\x1b[0m Created repair ticket with assigned technician "Mario Rossi"');

  // 8. Seed Notifications / Announcements (TC-TE-051)
  console.log('7. Seeding notifications and notices...');
  await adminClient.from('notifications').insert([
    {
      user_id: userId,
      type: 'announcement',
      title: 'Scheduled Water Tank Maintenance & Cleaning',
      message: 'Please be advised that the building main water tank will undergo scheduled pressure cleaning this Saturday from 9:00 AM to 1:00 PM. Water supply will be temporarily paused.',
      read: false,
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      user_id: userId,
      type: 'payment',
      title: 'October Statement of Account Available',
      message: `Your monthly statement of ₱${totalBillAmount.toLocaleString()} has been generated and is due on Oct 5.`,
      read: false,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ]);
  console.log('  \x1b[32m✓\x1b[0m Created building notices');

  // 9. Seed Direct Chat with Landlord (TC-TE-054)
  console.log('8. Initializing private landlord chat...');
  const convId = crypto.randomUUID();
  await adminClient.from('conversations').insert({ id: convId });
  await adminClient.from('conversation_participants').insert([
    { conversation_id: convId, user_id: userId },
    { conversation_id: convId, user_id: LANDLORD_ID },
  ]);
  await adminClient.from('messages').insert([
    {
      conversation_id: convId,
      sender_id: LANDLORD_ID,
      type: 'text',
      content: `Good day ${fullName.split(' ')[0]}! Welcome to Skyline Lofts ${targetUnit.name}. Please feel free to message me here anytime if you have any questions.`,
      created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    },
    {
      conversation_id: convId,
      sender_id: userId,
      type: 'text',
      content: 'Thank you Mr. Reyes! The room is wonderful. Quick question, where can I register for a motorcycle parking slot?',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      conversation_id: convId,
      sender_id: LANDLORD_ID,
      type: 'text',
      content: 'You can register directly with the lobby guard or send me your plate number here and I will have a slot reserved for you.',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
  ]);
  console.log('  \x1b[32m✓\x1b[0m Initialized direct landlord chat with message history');

  // 10. Ensure Active Application Invite Link (TC-TO-049) exists
  const inviteToken = 'demo-invite-2026';
  const tokenHash = hashInviteToken(inviteToken);
  await adminClient.from('tenant_intake_invites').upsert({
    public_token: inviteToken,
    token_hash: tokenHash,
    landlord_id: LANDLORD_ID,
    property_id: PROPERTY_ID,
    unit_id: RESERVED_INVITE_UNIT,
    mode: 'unit',
    application_type: 'online',
    status: 'active',
    max_uses: 100,
    use_count: 0,
    required_requirements: ['valid_id', 'proof_of_income', 'application_form'],
    expires_at: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
  }, { onConflict: 'public_token' });

  // 11. Verify Auth Login Handshake
  console.log('9. Verifying login credentials...');
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
  console.log(`    - Email:   ${testAuth.user.email}`);
  console.log(`    - Role:    ${testAuth.user.user_metadata?.role}`);

  console.log('\n\x1b[1m\x1b[32m====================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m ✨ Fresh Tenant Account is Ready for Testing! \x1b[0m');
  console.log('\x1b[1m\x1b[32m====================================================\x1b[0m');
  console.log(`\n  \x1b[1mLogin URL:\x1b[0m   /login`);
  console.log(`  \x1b[1mEmail:\x1b[0m       ${targetEmail}`);
  console.log(`  \x1b[1mPassword:\x1b[0m    ${defaultPassword}`);
  console.log(`  \x1b[1mResident:\x1b[0m    ${fullName}`);
  console.log(`  \x1b[1mProperty:\x1b[0m    Skyline Lofts (${targetUnit.name})`);
  console.log(`  \x1b[1mInvite URL:\x1b[0m  /apply/${inviteToken}\n`);
}

provisionTenantAccount().catch((err) => {
  console.error('\x1b[31mUnexpected error:\x1b[0m', err);
  process.exit(1);
});
