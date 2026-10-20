import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

export interface DemoSessionData {
  id: string
  email: string
  full_name: string
  role: UserRole
  organization_id: string
  organization_name: string
  avatar_url?: string
}

export const DEMO_PROFILES: Record<string, DemoSessionData> = {
  admin: {
    id: '86513161-6e70-41d3-affc-08d1ed12fc7d',
    email: 'admin@gymbooking.com',
    full_name: 'Alejandro Morales (Admin)',
    role: 'admin',
    organization_id: 'a0000000-0000-4000-8000-000000000001',
    organization_name: 'GymBooking España',
    avatar_url: '',
  },
  commercial: {
    id: '63af98ab-eb7e-4dc9-9dc4-a8bd77c3717f',
    email: 'comercial@gymbooking.com',
    full_name: 'Sara Benítez (Comercial)',
    role: 'commercial',
    organization_id: 'a0000000-0000-4000-8000-000000000001',
    organization_name: 'GymBooking España',
    avatar_url: '',
  },
  operations: {
    id: '5006b71c-fe13-4fb4-aae8-42d2a5bf29f5',
    email: 'operaciones@gymbooking.com',
    full_name: 'Carlos Rivas (Operaciones)',
    role: 'operations',
    organization_id: 'a0000000-0000-4000-8000-000000000001',
    organization_name: 'GymBooking España',
    avatar_url: '',
  },
}

export const DEMO_COOKIE_NAME = 'gymbooking_demo_session'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const roleKey = (body.role as string) || 'admin'
    const profile = DEMO_PROFILES[roleKey] || DEMO_PROFILES.admin

    // Sign in to Supabase Auth so SSR & RLS policies recognize auth.uid()
    try {
      const supabase = await createClient()
      await supabase.auth.signInWithPassword({
        email: profile.email,
        password: 'DemoPassword2026!',
      })
    } catch (authErr) {
      console.warn('Supabase Auth demo sign-in note:', authErr)
    }

    const cookieStore = await cookies()
    cookieStore.set(DEMO_COOKIE_NAME, JSON.stringify(profile), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      success: true,
      user: profile,
      message: `Sesión iniciada como ${profile.full_name}`,
    })
  } catch (error) {
    console.error('Error creating demo session:', error)
    return NextResponse.json(
      { error: 'Error al iniciar la sesión de demostración' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch {}

    const cookieStore = await cookies()
    cookieStore.delete(DEMO_COOKIE_NAME)
    return NextResponse.json({ success: true, message: 'Sesión demo cerrada' })
  } catch (error) {
    console.error('Error deleting demo session:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión de demostración' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(DEMO_COOKIE_NAME)
    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false })
    }
    const session = JSON.parse(sessionCookie.value) as DemoSessionData
    return NextResponse.json({ authenticated: true, user: session })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}
