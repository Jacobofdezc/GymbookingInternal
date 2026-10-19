// Script to initialize GymBooking Internal
// Run: npx tsx scripts/bootstrap.ts
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 
//           BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ORG_NAME in .env.local

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function bootstrap() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME || 'Admin'
  const orgName = process.env.BOOTSTRAP_ORG_NAME || 'GymBooking'
  const orgSlug = process.env.BOOTSTRAP_ORG_SLUG || 'gymbooking'

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  if (!adminEmail) {
    console.error('ERROR: Falta BOOTSTRAP_ADMIN_EMAIL')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Check if already bootstrapped
  const { count } = await supabase.from('organizations').select('*', { count: 'exact', head: true })
  if (count && count > 0) {
    console.error('ERROR: Ya existe una organización. El bootstrap solo puede ejecutarse una vez.')
    process.exit(1)
  }

  console.log(`Creando organización: ${orgName}...`)
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: orgName, slug: orgSlug })
    .select()
    .single()

  if (orgError) {
    console.error('ERROR creando organización:', orgError.message)
    process.exit(1)
  }

  console.log(`Organización creada: ${org.id}`)

  console.log('Sembrando datos iniciales...')
  const { error: seedError } = await supabase.rpc('seed_organization_data', { p_org_id: org.id })
  if (seedError) {
    console.error('ERROR sembrando datos:', seedError.message)
    process.exit(1)
  }

  // Create invitation so trigger can set up profile
  await supabase.from('invitations').insert({
    organization_id: org.id,
    email: adminEmail,
    role: 'admin',
  })

  console.log(`Invitando admin: ${adminEmail}...`)
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(adminEmail, {
    data: { full_name: adminName },
  })

  if (inviteError) {
    console.warn('AVISO al invitar usuario:', inviteError.message)
    console.log('Puede que el usuario ya exista. Crea el perfil manualmente si es necesario.')
  } else {
    console.log(`✓ Email de invitación enviado a ${adminEmail}`)
  }

  console.log('')
  console.log('=== Bootstrap completado ===')
  console.log(`Organization ID: ${org.id}`)
  console.log(`Admin Email: ${adminEmail}`)
  console.log('Revisa tu email y acepta la invitación.')
  console.log('')
}

bootstrap().catch(console.error)
