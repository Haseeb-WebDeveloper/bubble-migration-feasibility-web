import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check:', { user: user?.id, error: authError })

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: authError?.message 
      }, { status: 401 })
    }

    // Test bucket access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    console.log('Buckets:', buckets, 'Error:', bucketsError)

    // Test if user-images bucket exists
    const userImagesBucket = buckets?.find(b => b.name === 'user-images')
    console.log('User images bucket:', userImagesBucket)

    // Test listing files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('user-images')
      .list(user.id, {
        limit: 10
      })
    
    console.log('Files in user folder:', files, 'Error:', listError)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
      userImagesBucket,
      filesInUserFolder: files,
      errors: {
        auth: authError?.message,
        buckets: bucketsError?.message,
        list: listError?.message
      }
    })

  } catch (error) {
    console.error('Storage test error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}