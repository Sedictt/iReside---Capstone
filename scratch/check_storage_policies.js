
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hlpgsiqyrtndqdgvttcr.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscGdzaXF5cnRuZHFkZ3Z0dGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc5MiwiZXhwIjoyMDg2NjkzNzkyfQ._9HWOS8dxsbdbBlcMOFVpMPiGn8meeMqAP7-Cvn_Ro8'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkStoragePolicies() {
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'objects')
    .eq('schemaname', 'storage')

  if (error) {
    console.error('Error fetching policies:', error)
  } else {
    console.log('--- STORAGE POLICIES ---')
    data.forEach(p => {
      console.log(`- Policy: ${p.policyname}`)
      console.log(`  Cmd: ${p.cmd}`)
      console.log(`  Qual: ${p.qual}`)
      console.log(`  With Check: ${p.with_check}`)
      console.log('')
    })
  }
}

checkStoragePolicies()
