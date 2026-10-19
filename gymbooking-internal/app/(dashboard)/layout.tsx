import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import type { Profile } from '@/types/database'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch full user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If user account is marked inactive by admin
  if (profile && profile.is_active === false) {
    redirect('/login?error=inactive')
  }

  // Fallback profile if record hasn't synced yet
  const userProfile: Profile = (profile as Profile) || {
    id: user.id,
    organization_id: '',
    email: user.email || '',
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
    role: (user.user_metadata?.role as any) || 'commercial',
    avatar_url: user.user_metadata?.avatar_url || null,
    phone: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return <AppLayout userProfile={userProfile}>{children}</AppLayout>
}
