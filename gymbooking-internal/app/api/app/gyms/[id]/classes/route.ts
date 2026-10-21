import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * Public/App API: Get published classes for a gym.
 * Ready for consumption by the GymBooking mobile app or booking widget.
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: gymId } = await params
    const supabase = await createClient()

    // 1. Fetch gym information
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name, city, address, postal_code, phone, email, website')
      .eq('id', gymId)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 })
    }

    // 2. Fetch published classes with schedules & discipline
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        description,
        level,
        duration_minutes,
        capacity,
        price,
        price_currency,
        booking_method,
        publication_status,
        discipline:disciplines(id, name, slug),
        class_schedules(id, day_of_week, start_time, end_time, is_active)
      `)
      .eq('gym_id', gymId)
      .eq('publication_status', 'published')
      .order('name')

    if (classesError) {
      return NextResponse.json({ error: classesError.message }, { status: 500 })
    }

    const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    const formattedClasses = (classes || []).map((cls) => ({
      ...cls,
      schedules: (cls.class_schedules || [])
        .filter((s: any) => s.is_active)
        .map((s: any) => ({
          id: s.id,
          day_of_week: s.day_of_week,
          day_name: DAY_NAMES[s.day_of_week] || 'Desconocido',
          start_time: s.start_time?.slice(0, 5),
          end_time: s.end_time?.slice(0, 5),
        })),
    }))

    return NextResponse.json({
      success: true,
      gym,
      published_classes_count: formattedClasses.length,
      classes: formattedClasses,
      api_version: 'v1',
      generated_at: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 })
  }
}
