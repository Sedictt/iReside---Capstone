
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlpgsiqyrtndqdgvttcr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscGdzaXF5cnRuZHFkZ3Z0dGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc5MiwiZXhwIjoyMDg2NjkzNzkyfQ._9HWOS8dxsbdbBlcMOFVpMPiGn8meeMqAP7-Cvn_Ro8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAndAddColumn() {
    console.log('Checking for avatar_bg_color column...');
    const { data, error } = await supabase.from('profiles').select('avatar_bg_color').limit(1);
    
    if (error && error.message.includes('column "avatar_bg_color" does not exist')) {
        console.log('Column does not exist. Attempting to add via RPC if available...');
        // Usually exec_sql is not available for security reasons.
        // If it's not available, I'll have to ask the user to add it or use metadata.
        const { error: rpcError } = await supabase.rpc('exec_sql', { query: "ALTER TABLE profiles ADD COLUMN avatar_bg_color TEXT DEFAULT '#171717';" });
        if (rpcError) {
            console.error('RPC failed:', rpcError);
            console.log('Falling back to user_metadata if possible, or just informing the user.');
        } else {
            console.log('Column added successfully via RPC!');
        }
    } else if (error) {
        console.error('Error checking column:', error);
    } else {
        console.log('Column already exists.');
    }
}

checkAndAddColumn();
