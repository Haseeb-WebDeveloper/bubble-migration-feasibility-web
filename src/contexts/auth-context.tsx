'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type AuthContextType = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient()) // Create client only once

  useEffect(() => {
    let isMounted = true
    let initialLoadDone = false

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (isMounted && !initialLoadDone) {
          if (error) {
            console.error('Error getting user:', error)
            setUser(null)
          } else {
            console.log('Initial user loaded:', user?.id)
            setUser(user)
          }
          setLoading(false)
          initialLoadDone = true
        }
      } catch (error) {
        console.error('Auth error:', error)
        if (isMounted && !initialLoadDone) {
          setUser(null)
          setLoading(false)
          initialLoadDone = true
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        if (isMounted) {
          // Only update if this is a real change
          const newUser = session?.user ?? null
          setUser(prevUser => {
            if (prevUser?.id !== newUser?.id) {
              console.log('User actually changed from', prevUser?.id, 'to', newUser?.id)
              return newUser
            }
            return prevUser
          })
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}