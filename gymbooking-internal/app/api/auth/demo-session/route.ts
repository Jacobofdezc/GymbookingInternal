import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { UserRole, Profile } from '@/types/database'

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
    id: 'demo-admin-uuid-0001',
    email: 'admin@gymbooking.com',
    full_name: 'Alejandro Morales (Admin)',
    role: 'admin',
    organization_id: 'org-gymbooking-demo',
    organization_name: 'GymBooking España',
    avatar_url: '',
  },
  commercial: {
    id: 'demo-commercial-uuid-0002',
    email: 'comercial@gymbooking.com',
    full_name: 'Sara Benítez (Comercial)',
    role: 'commercial',
    organization_id: 'org-gymbooking-demo',
    organization_name: 'GymBooking España',
    avatar_url: '',
  },
  operations: {
    id: 'demo-ops-uuid-0003',
    email: 'operaciones@gymbooking.com',
    full_name: 'Carlos Rivas (Operaciones)',
    role: 'operations',
    organization_id: 'org-gymbooking-demo',
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
