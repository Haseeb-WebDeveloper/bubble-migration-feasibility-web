import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { storage, ImageType } from '@/lib/supabase/storage'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageType = searchParams.get('type') as ImageType
    const imageUrl = searchParams.get('url')

    if (!imageType || !['profile', 'banner'].includes(imageType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
    }

    // Extract path from URL
    const urlParts = imageUrl.split('/')
    const pathIndex = urlParts.findIndex(part => part === 'user-images')
    
    if (pathIndex === -1 || pathIndex >= urlParts.length - 1) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 })
    }

    const path = urlParts.slice(pathIndex + 1).join('/')

    // Delete from storage
    const deleted = await storage.deleteImage(path)
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
    }

    // Update profile in database
    const updateData = imageType === 'profile' 
      ? { profileImage: null }
      : { bannerImage: null }

    const updatedProfile = await prisma.profile.update({
      where: { userId: user.id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}