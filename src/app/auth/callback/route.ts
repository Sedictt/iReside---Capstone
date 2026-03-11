import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Determine the redirect based on the role, defaulting to tenant dashboard
      const { data: { user } } = await supabase.auth.getUser()
      const role = user?.user_metadata?.role || 'tenant'
      const redirectPath = role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard'
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate with provider`)
}
