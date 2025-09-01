import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { storage, ImageType } from '@/lib/supabase/storage'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const imageType = formData.get('type') as ImageType

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!imageType || !['profile', 'banner'].includes(imageType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
    }

    // Validate file
    const validation = storage.validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Get current profile to delete old image if exists
    const currentProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { 
        profileImage: true, 
        bannerImage: true 
      }
    })

    // Upload new image
    const uploadResult = await storage.uploadImage(file, user.id, imageType)
    if (!uploadResult) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Delete old image if exists
    if (currentProfile) {
      const oldImageUrl = imageType === 'profile' 
        ? currentProfile.profileImage 
        : currentProfile.bannerImage
      
      if (oldImageUrl) {
        // Extract path from URL for deletion
        const urlParts = oldImageUrl.split('/')
        const pathIndex = urlParts.findIndex(part => part === 'user-images')
        if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
          const path = urlParts.slice(pathIndex + 1).join('/')
          await storage.deleteImage(path)
        }
      }
    }

    // Update profile in database
    const updateData = imageType === 'profile' 
      ? { profileImage: uploadResult.url }
      : { bannerImage: uploadResult.url }

    const updatedProfile = await prisma.profile.update({
      where: { userId: user.id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      url: uploadResult.url,
      path: uploadResult.path,
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}