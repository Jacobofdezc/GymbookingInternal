'use server'

import { createClient } from '@/lib/supabase/server'

export async function loginAction(email: string, redirectTo?: string) {
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const targetRedirect = redirectTo ? encodeURIComponent(redirectTo) : '%2Fdashboard'
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?redirectTo=${targetRedirect}`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
