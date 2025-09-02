'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { ImageUpload } from '@/components/ui/image-upload'
import { Loader2, Save, User, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }).optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  bio: z.string().max(500, {
    message: 'Bio must not be longer than 500 characters.',
  }).optional().or(z.literal('')),
})

type FormData = z.infer<typeof formSchema>

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [bannerImage, setBannerImage] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      country: '',
      bio: '',
    },
  })

  // Load user profile
  useEffect(() => {
    let isMounted = true
    
    async function loadProfile() {
      if (!user?.id) return
      
      // Only load if we don't have a profile or it's for a different user
      if (profile?.userId === user.id) {
        return
      }
      
      setIsLoading(true)
      try {
        console.log('Loading profile for settings:', user.id)
        const response = await fetch(`/api/profile/${user.id}`)
        if (response.ok && isMounted) {
          const profileData = await response.json()
          setProfile(profileData)
          setProfileImage(profileData.profileImage)
          setBannerImage(profileData.bannerImage)
          form.reset({
            name: profileData.name || '',
            country: profileData.country || '',
            bio: profileData.bio || '',
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()
    
    return () => {
      isMounted = false
    }
  }, [user?.id, form]) // Simplified dependencies

  // Handle image uploads
  const handleImageUpload = async (file: File, type: 'profile' | 'banner'): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      
      // Update local state
      if (type === 'profile') {
        setProfileImage(result.url)
      } else {
        setBannerImage(result.url)
      }

      return result.url
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
      return null
    }
  }

  const handleImageDelete = async (type: 'profile' | 'banner') => {
    try {
      const imageUrl = type === 'profile' ? profileImage : bannerImage
      if (!imageUrl) return

      const response = await fetch(`/api/delete/image?type=${type}&url=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      // Update local state
      if (type === 'profile') {
        setProfileImage(null)
      } else {
        setBannerImage(null)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete image')
    }
  }

  async function onSubmit(values: FormData) {
    if (!user) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      
      // Show success message (you could add a toast here)
      console.log('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      // You could add error handling/toast here
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and profile information.
        </p>
      </div>

      {/* Profile Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <CardTitle>Profile Image</CardTitle>
            </div>
            <CardDescription>
              Upload your profile picture or take a new photo with your camera (recommended: 400x400px)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={profileImage || undefined}
              onChange={(url) => setProfileImage(url)}
              onUpload={(file) => handleImageUpload(file, 'profile')}
              aspectRatio="square"
              placeholder="Upload profile image"
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <CardTitle>Banner Image</CardTitle>
            </div>
            <CardDescription>
              Upload your banner image or take a new photo with your camera (recommended: 1200x400px)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={bannerImage || undefined}
              onChange={(url) => setBannerImage(url)}
              onUpload={(file) => handleImageUpload(file, 'banner')}
              aspectRatio="banner"
              placeholder="Upload banner image"
              disabled={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>
            Update your personal information and bio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Your email address cannot be changed.
                </p>
              </div>

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This is your public display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your country"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Where are you located?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tell us a little about yourself"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description for your profile. Maximum 500 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account details and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">User ID</span>
              <span className="text-sm text-muted-foreground font-mono">
                {user?.id}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">Account Created</span>
              <span className="text-sm text-muted-foreground">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm text-muted-foreground">
                {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}