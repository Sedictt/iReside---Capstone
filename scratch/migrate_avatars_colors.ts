
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PRESET_COLORS = [
    "#171717", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", 
    "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899", "#71717a"
];

async function migrateAvatarsAndColors() {
    console.log('Fetching all profiles...');
    const { data: profiles, error } = await supabase.from('profiles').select('id, avatar_url');
    
    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }
    
    console.log(`Found ${profiles.length} profiles. Updating...`);
    
    const BUCKET_NAME = 'profile-avatars';
    
    for (const profile of profiles) {
        const randomNum = Math.floor(Math.random() * (18 - 3 + 1)) + 3;
        const path = `default_avatars/${randomNum}.png`;
        const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
        
        const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        
        console.log(`Updating profile ${profile.id} with avatar ${publicUrl} and color ${randomColor}`);
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                avatar_url: publicUrl,
                avatar_bg_color: randomColor
            } as any)
            .eq('id', profile.id);
            
        if (updateError) {
            console.error(`Error updating profile ${profile.id}:`, updateError);
        }
    }
    
    console.log('Migration complete!');
}

migrateAvatarsAndColors();
