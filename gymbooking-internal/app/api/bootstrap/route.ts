import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Only runs if no organizations exist
  // Creates organization from env vars
  // Creates first admin user
  // Calls seed_organization_data(org_id)
  // Returns { success: true, orgId, message }
  // If org already exists, return error 400

  const supabase = await createAdminClient()

  // Check if already bootstrapped
  const { count } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'Ya existe una organización. Bootstrap solo puede ejecutarse una vez.' },
      { status: 400 }
    )
  }

  const orgName = process.env.BOOTSTRAP_ORG_NAME || 'GymBooking'
  const orgSlug = process.env.BOOTSTRAP_ORG_SLUG || 'gymbooking'
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME || 'Admin'

  if (!adminEmail) {
    return NextResponse.json(
      { error: 'BOOTSTRAP_ADMIN_EMAIL no está configurado' },
      { status: 400 }
    )
  }

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: orgName, slug: orgSlug })
    .select()
    .single()

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  // Seed initial data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)('seed_organization_data', { p_org_id: org.id })

  // Create admin user via magic link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    adminEmail,
    {
      data: { full_name: adminName },
      redirectTo: `${appUrl}/auth/callback?redirectTo=/dashboard`,
    }
  )

  // Create invitation record so handle_new_user trigger can pick it up
  await supabase.from('invitations').insert({
    organization_id: org.id,
    email: adminEmail,
    role: 'admin',
  })

  if (inviteError) {
    // If user already exists, just create their profile
    return NextResponse.json({
      success: true,
      orgId: org.id,
      warning: `User invite error (may already exist): ${inviteError.message}. Create profile manually if needed.`,
      message: `Organización creada. Configura el admin manualmente en Supabase Dashboard.`,
    })
  }

  return NextResponse.json({
    success: true,
    orgId: org.id,
    message: `Organización creada. Se ha enviado un email de invitación a ${adminEmail}.`,
  })
}
