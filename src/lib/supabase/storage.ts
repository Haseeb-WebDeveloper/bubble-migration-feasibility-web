import { createClient } from './server'

export type ImageType = 'profile' | 'banner'

export class SupabaseStorage {
  private readonly BUCKET_NAME = 'user-images'

  // Create server client for each operation to ensure fresh auth
  private async getSupabaseClient() {
    return await createClient()
  }



  /**
   * Upload an image to Supabase Storage
   */
  async uploadImage(
    file: File,
    userId: string,
    imageType: ImageType
  ): Promise<{ url: string; path: string } | null> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${imageType}-${Date.now()}.${fileExt}`

      // Upload file
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Upload error details:', {
          message: error.message,
          error: error,
          fileName,
          userId,
          imageType
        })
        return null
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path)

      return {
        url: urlData.publicUrl,
        path: data.path
      }
    } catch (error) {
      console.error('Upload failed:', error)
      return null
    }
  }

  /**
   * Delete an image from Supabase Storage
   */
  async deleteImage(path: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient()
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path])

      if (error) {
        console.error('Delete error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Delete failed:', error)
      return false
    }
  }

  /**
   * Get public URL for an image
   */
  async getPublicUrl(path: string): Promise<string> {
    const supabase = await this.getSupabaseClient()
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(path)
    
    return data.publicUrl
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Please upload a valid image file (JPEG, PNG, or WebP)'
      }
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Image size must be less than 5MB'
      }
    }

    return { valid: true }
  }
}

// Export singleton instance
export const storage = new SupabaseStorage()