import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const getDashboardPathForRole = (role: string) => {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'landlord') return '/landlord/dashboard'
  return '/tenant/dashboard'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      let role = user?.user_metadata?.role

      if (!role && user?.id) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        role = profile?.role ?? undefined
      }

      const redirectPath = next || getDashboardPathForRole(role || 'tenant')
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate with provider`)
}
