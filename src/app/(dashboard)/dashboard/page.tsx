'use client'

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Settings, User, Calendar, Camera } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user profile
  useEffect(() => {
    let isMounted = true
    
    async function loadProfile() {
      if (!user?.id) {
        if (isMounted) setIsLoading(false)
        return
      }
      
      // Only load if we don't have a profile or it's for a different user
      if (profile?.userId === user.id) {
        if (isMounted) setIsLoading(false)
        return
      }
      
      try {
        console.log('Loading profile for user:', user.id)
        const response = await fetch(`/api/profile/${user.id}`)
        if (response.ok && isMounted) {
          const profileData = await response.json()
          setProfile(profileData)
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
  }, [user?.id]) // Only depend on user.id, not the whole profile object

  return (
    <div className="space-y-8">
      {/* Profile Header with Banner */}
      <div className="relative">
        {/* Banner Image */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
          {profile?.bannerImage ? (
            <Image
              src={profile.bannerImage}
              alt="Banner"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/80">
                <Camera className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Add a banner image</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Image */}
        <div className="absolute -bottom-12 left-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
              {profile?.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt="Profile"
                  fill
                  className="object-cover rounded-full"
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                  <User className="h-8 w-8 text-gray-600" />
                </div>
              )}
            </div>
            {/* Quick camera button overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
              <Button
                size="sm"
                variant="secondary"
                asChild
                className="rounded-full w-8 h-8 p-0"
                title="Update profile picture"
              >
                <Link href="/dashboard/settings">
                  <Camera className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="pt-16">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back{profile?.name ? `, ${profile.name}` : ''}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Your account is in good standing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.email?.split('@')[0] || 'User'}
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.email}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Login</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today</div>
            <p className="text-xs text-muted-foreground">
              Welcome back
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your account and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Update Profile
              </Link>
            </Button>
            <Button variant="outline">
              <User className="mr-2 h-4 w-4" />
              View Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}