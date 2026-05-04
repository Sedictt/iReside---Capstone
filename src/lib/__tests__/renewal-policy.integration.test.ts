import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load local env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

describe("Renewal Policy Integration", () => {
    let testProperty: any;
    let testLandlord: any;

    beforeAll(async () => {
        // Get an existing landlord profile
        const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
        if (!profiles || profiles.length === 0) {
            throw new Error("No profiles found in database");
        }
        testLandlord = profiles[0];

        // Create a property for testing
        const { data: prop, error: propErr } = await supabase.from('properties').insert({
            name: "Policy Test Property",
            address: "789 Policy Ave",
            landlord_id: testLandlord.id,
            renewal_window_days: 90
        }).select().single();
        
        if (propErr) throw propErr;
        testProperty = prop;
    });

    afterAll(async () => {
        if (testProperty) {
            await supabase.from('properties').delete().eq('id', testProperty.id);
        }
    });

    it("should allow a landlord to set a renewal policy", async () => {
        const settings = {
            base_rent_adjustment: 10,
            adjustment_type: "percentage",
            new_rules: ["No smoking on balcony", "Quiet hours start at 9 PM"],
            landlord_memo: "Welcome to 2026 renewal window!",
            is_enabled: true
        };

        const { data: updated, error } = await supabase
            .from('properties')
            .update({ renewal_settings: settings })
            .eq('id', testProperty.id)
            .select()
            .single();

        if (error) throw error;
        
        expect(updated.renewal_settings).toEqual(settings);
        expect(updated.renewal_settings.new_rules).toContain("No smoking on balcony");
    });

    it("should allow a tenant to see the property's renewal settings", async () => {
        // Simulate what the tenant sees in their lease hub
        const { data: prop, error } = await supabase
            .from('properties')
            .select('renewal_settings')
            .eq('id', testProperty.id)
            .single();

        if (error) throw error;
        
        expect(prop.renewal_settings.base_rent_adjustment).toBe(10);
        expect(prop.renewal_settings.landlord_memo).toBe("Welcome to 2026 renewal window!");
    });

    it("should maintain default settings if not explicitly set", async () => {
        // Create another property without setting renewal_settings
        const { data: prop, error } = await supabase.from('properties').insert({
            name: "Default Policy Test",
            address: "456 Default St",
            landlord_id: testLandlord.id
        }).select().single();

        if (error) throw error;

        // Check default JSONB value from migration
        expect(prop.renewal_settings.is_enabled).toBe(true);
        expect(prop.renewal_settings.base_rent_adjustment).toBe(0);
        
        // Cleanup
        await supabase.from('properties').delete().eq('id', prop.id);
    });
});
