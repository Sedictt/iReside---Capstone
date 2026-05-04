import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load local env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

describe("Lease Renewal Integration", () => {
    let testProperty: any;
    let testUnit: any;
    let testTenant: any;
    let testLandlord: any;
    let testLease: any;

    beforeAll(async () => {
        // 1. Setup test data
        // Get existing landlord/tenant or create new ones
        const { data: profiles } = await supabase.from('profiles').select('*').limit(5);
        if (!profiles || profiles.length < 2) {
            throw new Error("Need at least 2 profiles in database for integration test");
        }
        
        // Find a landlord and a tenant (or just use first two)
        testLandlord = profiles[0];
        testTenant = profiles[1];

        // Create property
        const { data: prop, error: propErr } = await supabase.from('properties').insert({
            name: "Test Integration Property",
            address: "123 Test St",
            landlord_id: testLandlord.id,
            renewal_window_days: 90
        }).select().single();
        
        if (propErr) throw propErr;
        testProperty = prop;

        // Create unit
        const { data: unit, error: unitErr } = await supabase.from('units').insert({
            property_id: testProperty.id,
            name: "RENEW-" + Math.floor(Math.random() * 10000),
            rent_amount: 1000,
            floor: 1,
            status: 'occupied'
        }).select().single();
        
        if (unitErr) throw unitErr;
        testUnit = unit;
    });

    afterAll(async () => {
        // Cleanup in reverse order
        if (testLease) await supabase.from('leases').delete().eq('id', testLease.id);
        if (testUnit) await supabase.from('units').delete().eq('id', testUnit.id);
        if (testProperty) await supabase.from('properties').delete().eq('id', testProperty.id);
        
        // Also cleanup renewal requests linked to test lease
        if (testLease) {
            await supabase.from('renewal_requests').delete().eq('current_lease_id', testLease.id);
            await supabase.from('notifications').delete().eq('user_id', testTenant.id).eq('type', 'lease_renewal_available');
        }
    });

    it("should trigger a notification when lease is within 90 days", async () => {
        // 1. Create a lease that expires in 45 days
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 45);

        const { data: lease, error } = await supabase.from('leases').insert({
            unit_id: testUnit.id,
            tenant_id: testTenant.id,
            landlord_id: testLandlord.id,
            status: 'active',
            start_date: new Date().toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            monthly_rent: 1000
        }).select().single();
        
        testLease = lease;
        if (error) throw error;
        expect(lease).toBeDefined();

        // 2. Call the renewal check function
        const { error: funcError } = await supabase.rpc('check_renewal_windows');
        if (funcError) throw funcError;

        // 3. Verify notification was created
        const { data: notifications } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', testTenant.id)
            .eq('type', 'lease_renewal_available')
            .order('created_at', { ascending: false })
            .limit(1);

        expect(notifications?.[0]).toBeDefined();
        expect(notifications?.[0].data.lease_id).toBe(testLease.id);
    });

    it("should allow submitting a renewal request", async () => {
        const { data: request, error } = await supabase.from('renewal_requests').insert({
            current_lease_id: testLease.id,
            tenant_id: testTenant.id,
            landlord_id: testLandlord.id,
            status: 'pending',
            proposed_monthly_rent: 1050
        }).select().single();

        if (error) throw error;
        expect(request.status).toBe('pending');
    });

    it("should reject duplicate pending renewal requests", async () => {
        const { error } = await supabase.from('renewal_requests').insert({
            current_lease_id: testLease.id,
            tenant_id: testTenant.id,
            landlord_id: testLandlord.id,
            status: 'pending',
            proposed_monthly_rent: 1100
        });

        // Should fail due to the unique index unique_pending_renewal
        expect(error).not.toBeNull();
        expect(error?.code).toBe('23505'); // PostgreSQL unique violation code
    });
});
