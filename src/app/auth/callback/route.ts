import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Create or update user profile in database
      try {
        await prisma.profile.upsert({
          where: { userId: data.user.id },
          update: { 
            email: data.user.email || '',
            updatedAt: new Date()
          },
          create: {
            userId: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.full_name || null,
          },
        })
      } catch (dbError) {
        console.error('Database error:', dbError)
        // Continue with auth even if profile creation fails
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}