import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        authError: authError?.message 
      }, { status: 401 })
    }

    // Create a simple test file
    const testContent = 'test file content'
    const testFile = new Blob([testContent], { type: 'text/plain' })
    const fileName = `${user.id}/test-${Date.now()}.txt`

    console.log('Testing upload with:', {
      userId: user.id,
      fileName,
      bucketName: 'user-images'
    })

    // Try to upload
    const { data, error } = await supabase.storage
      .from('user-images')
      .upload(fileName, testFile, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Test upload error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        errorDetails: error,
        fileName,
        userId: user.id
      })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-images')
      .getPublicUrl(data.path)

    // Clean up - delete the test file
    await supabase.storage
      .from('user-images')
      .remove([data.path])

    return NextResponse.json({
      success: true,
      message: 'Storage upload test successful!',
      uploadedPath: data.path,
      publicUrl: urlData.publicUrl,
      userId: user.id
    })

  } catch (error) {
    console.error('Test upload failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}