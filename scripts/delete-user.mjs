#!/usr/bin/env node

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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\x1b[31m[Error] Missing required Supabase environment variables.\x1b[0m');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const targetArg = process.argv.slice(2).find((arg) => arg.includes('@') || arg.length === 36)?.trim();

if (!targetArg) {
  console.error('\x1b[31m[Usage] node scripts/delete-user.mjs <email-or-uuid>\x1b[0m');
  console.log('Example: node scripts/delete-user.mjs test.user@example.com');
  process.exit(1);
}

async function findUser(target) {
  if (target.includes('@')) {
    const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase());
    return found || null;
  } else {
    const { data, error } = await adminClient.auth.admin.getUserById(target);
    if (error) return null;
    return data?.user || null;
  }
}

async function cleanStorage(userId) {
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
              const filePaths = subItems.map((f) => `${subPath}/${f.name}`);
              await adminClient.storage.from(b.name).remove(filePaths);
            }
            await adminClient.storage.from(b.name).remove([subPath]);
          }
          console.log(`  \x1b[32m✓\x1b[0m Storage bucket '${b.name}' wiped for user`);
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('  \x1b[33m!\x1b[0m Storage warning:', err.message);
  }
}

async function cleanDatabase(userId) {
  // Properties
  const { data: props } = await adminClient
    .from('properties')
    .select('id, name')
    .eq('landlord_id', userId);

  const propIds = (props || []).map((p) => p.id);

  if (propIds.length > 0) {
    console.log(`  Found ${propIds.length} properties owned by user:`, props.map((p) => p.name).join(', '));

    // Units
    const { data: units } = await adminClient.from('units').select('id').in('property_id', propIds);
    const unitIds = (units || []).map((u) => u.id);

    // Leases
    const { data: leases } = await adminClient.from('leases').select('id').eq('landlord_id', userId);
    let leaseIds = (leases || []).map((l) => l.id);

    // Community
    const { data: posts } = await adminClient.from('community_posts').select('id').in('property_id', propIds);
    const postIds = (posts || []).map((p) => p.id);
    if (postIds.length > 0) {
      await adminClient.from('community_comments').delete().in('post_id', postIds);
      await adminClient.from('community_likes').delete().in('post_id', postIds);
      await adminClient.from('community_media').delete().in('post_id', postIds);
      await adminClient.from('community_posts').delete().in('id', postIds);
    }

    // Payments
    let paymentIds = [];
    if (propIds.length > 0) {
      const { data: pmts } = await adminClient.from('payments').select('id').in('property_id', propIds);
      (pmts || []).forEach((p) => paymentIds.push(p.id));
    }
    if (paymentIds.length > 0) {
      await adminClient.from('payment_receipts').delete().in('payment_id', paymentIds);
      await adminClient.from('payment_workflow_audit_events').delete().in('payment_id', paymentIds);
      await adminClient.from('payment_items').delete().in('payment_id', paymentIds);
      await adminClient.from('payments').delete().in('id', paymentIds);
    }
    await adminClient.from('payments').delete().eq('landlord_id', userId);

    if (leaseIds.length > 0) {
      await adminClient.from('renewal_requests').delete().in('current_lease_id', leaseIds);
      await adminClient.from('renewal_requests').delete().in('new_lease_id', leaseIds);
      await adminClient.from('lease_signing_audit').delete().in('lease_id', leaseIds);
      await adminClient.from('leases').delete().in('id', leaseIds);
    }

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
      const reqIds = requests.map((r) => r.id);
      await adminClient.from('maintenance_updates').delete().in('maintenance_request_id', reqIds);
    }
    await adminClient.from('maintenance_requests').delete().in('property_id', propIds);

    if (unitIds.length > 0) {
      await adminClient.from('units').delete().in('property_id', propIds);
    }
    await adminClient.from('properties').delete().in('id', propIds);
  }

  // Tenant / general user records
  await adminClient.from('community_comments').delete().eq('author_id', userId);
  await adminClient.from('community_likes').delete().eq('user_id', userId);
  await adminClient.from('community_posts').delete().eq('author_id', userId);
  await adminClient.from('leases').delete().eq('tenant_id', userId);
  await adminClient.from('applications').delete().eq('tenant_id', userId);
  await adminClient.from('maintenance_requests').delete().eq('tenant_id', userId);
  await adminClient.from('payments').delete().eq('tenant_id', userId);
  await adminClient.from('user_security_settings').delete().eq('profile_id', userId);
  await adminClient.from('landlord_business_profiles').delete().eq('profile_id', userId);
  await adminClient.from('notifications').delete().eq('user_id', userId);
  await adminClient.from('announcements').delete().eq('landlord_id', userId);
  await adminClient.from('landlord_reviews').delete().eq('landlord_id', userId);
  await adminClient.from('landlord_payment_destinations').delete().eq('landlord_id', userId);
  await adminClient.from('landlord_statistics_exports').delete().eq('landlord_id', userId);
  await adminClient.from('landlord_inquiry_actions').delete().eq('landlord_id', userId);
  await adminClient.from('profiles').delete().eq('id', userId);
}

async function run() {
  console.log(`\n\x1b[1m\x1b[36m=== User Purge & Cleanup ===\x1b[0m`);
  console.log(`Target: \x1b[33m${targetArg}\x1b[0m\n`);

  const user = await findUser(targetArg);

  if (!user) {
    // Check if profile exists even without auth user
    const { data: prof } = await adminClient.from('profiles').select('id, email, full_name').eq('email', targetArg).maybeSingle();
    if (prof) {
      console.log(`Found orphan profile in public.profiles: ${prof.id} (${prof.email})`);
      await cleanDatabase(prof.id);
      await cleanStorage(prof.id);
      console.log('\x1b[32m✓ Cleaned orphan profile and storage successfully.\x1b[0m\n');
      return;
    }
    console.log('\x1b[33m[Notice] User does not exist in Supabase Auth or Profiles.\x1b[0m');
    console.log('The email is already completely available for use.\n');
    return;
  }

  console.log(`Found Auth User: \x1b[32m${user.id}\x1b[0m (${user.email})`);

  console.log('Cleaning storage buckets...');
  await cleanStorage(user.id);

  console.log('Cleaning database relational records...');
  await cleanDatabase(user.id);

  console.log('Deleting from Supabase Auth...');
  const { error: delErr } = await adminClient.auth.admin.deleteUser(user.id);
  if (delErr) {
    throw new Error(`Failed to delete user from Supabase Auth: ${delErr.message}`);
  }

  console.log(`\n\x1b[32m✓ SUCCESS: User '${user.email}' (${user.id}) completely purged!\x1b[0m`);
  console.log(`You can now immediately register or claim this email again.\n`);
}

run().catch((err) => {
  console.error('\x1b[31m[Error]\x1b[0m', err.message);
  process.exit(1);
});
