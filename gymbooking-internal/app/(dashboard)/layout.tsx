import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { AppLayout } from '@/components/layout/AppLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentUser()

  if (!profile) {
    redirect('/login')
  }

  // If user account is marked inactive by admin
  if (profile.is_active === false) {
    redirect('/login?error=inactive')
  }

  return <AppLayout userProfile={profile}>{children}</AppLayout>
}
