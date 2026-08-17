// Re-export the browser client for backward compatibility
// Prefer importing from '@/lib/supabase/client' or '@/lib/supabase/server' directly
export { createBrowserSupabaseClient, createClient } from './supabase/client'
