import { createAdminClient } from "./src/lib/supabase/admin.js";

const supabase = createAdminClient();

async function checkColumns() {
    const { data, error } = await supabase
        .from('landlord_applications')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found in landlord_applications:', Object.keys(data[0]));
    } else {
        console.log('No data in landlord_applications table.');
    }
}

checkColumns();
