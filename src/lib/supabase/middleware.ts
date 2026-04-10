import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    // This refreshes the session token if expired.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Let API route handlers return structured JSON auth errors (401/403)
    // instead of redirecting fetch requests to HTML pages.
    if (request.nextUrl.pathname.startsWith('/api')) {
        return supabaseResponse
    }

    // Resolve role — prefer JWT metadata (fast, no DB hit), fall back to profiles table
    let role: string | null = user?.user_metadata?.role ?? null
    if (user && !role) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        role = profile?.role ?? 'tenant'
    }

    // Protect /admin routes — only allow users with admin role
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
        if (role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = role === 'landlord' ? '/landlord/dashboard' : '/tenant/community'
            return NextResponse.redirect(url)
        }
    }

    // If user is already logged in, prevent them from accessing auth pages
    if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
        const url = request.nextUrl.clone()
        if (role === 'admin') url.pathname = '/admin/dashboard'
        else if (role === 'landlord') url.pathname = '/landlord/dashboard'
        else url.pathname = '/tenant/community'
        return NextResponse.redirect(url)
    }

    // If user is not signed in and the current path is not /login, /signup, or /,
    // redirect the user to /login
    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/signup') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/become-a-landlord')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Add cache-control headers to prevent back-button access to protected pages
    // These headers ensure that authenticated pages are not cached by the browser
    if (user && supabaseResponse.headers instanceof Headers) {
        supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        supabaseResponse.headers.set('Pragma', 'no-cache')
        supabaseResponse.headers.set('Expires', '0')
    }

    return supabaseResponse
}

