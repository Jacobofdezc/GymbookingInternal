/**
 * Route Smoke Test Script for GymBooking Internal CRM
 * Verifies that key routes, API endpoints, and static pages respond properly.
 * Usage: npx tsx scripts/smoke-test-routes.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

interface RouteCheck {
  path: string
  expectedStatus: number[]
  description: string
}

const ROUTES_TO_TEST: RouteCheck[] = [
  { path: '/login', expectedStatus: [200], description: 'Login Page (public)' },
  { path: '/dashboard', expectedStatus: [200, 302, 307], description: 'Dashboard Page' },
  { path: '/gyms', expectedStatus: [200, 302, 307], description: 'Gyms Directory' },
  { path: '/pipeline', expectedStatus: [200, 302, 307], description: 'Commercial Pipeline' },
  { path: '/tasks', expectedStatus: [200, 302, 307], description: 'Tasks Management' },
  { path: '/calendar', expectedStatus: [200, 302, 307], description: 'Calendar & Visits' },
  { path: '/interactions', expectedStatus: [200, 302, 307], description: 'Interactions & Communications' },
  { path: '/documents', expectedStatus: [200, 302, 307], description: 'Documents & Storage' },
  { path: '/operations', expectedStatus: [200, 302, 307], description: 'Operations & Onboarding' },
  { path: '/issues', expectedStatus: [200, 302, 307], description: 'Issues & Incidents' },
  { path: '/knowledge', expectedStatus: [200, 302, 307], description: 'Knowledge Base & Decisions (ADR)' },
  { path: '/team', expectedStatus: [200, 302, 307], description: 'Team Management' },
  { path: '/settings', expectedStatus: [200, 302, 307], description: 'Settings & Audit Logs' },
]

async function runSmokeTests() {
  console.log(`\n======================================================`)
  console.log(`🚀 Starting GymBooking CRM Route Smoke Tests`)
  console.log(`🌐 Base URL: ${BASE_URL}`)
  console.log(`======================================================\n`)

  let passed = 0
  let failed = 0

  for (const route of ROUTES_TO_TEST) {
    const url = `${BASE_URL}${route.path}`
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'manual', // do not follow redirects so we can inspect 307/302 auth redirects
      })

      const status = response.status
      const isExpected = route.expectedStatus.includes(status)

      if (isExpected) {
        console.log(`✅ [${status}] ${route.path.padEnd(18)} — ${route.description}`)
        passed++
      } else {
        console.error(
          `❌ [${status}] ${route.path.padEnd(18)} — Expected ${route.expectedStatus.join(
            '/'
          )}, got ${status}`
        )
        failed++
      }
    } catch (err: unknown) {
      console.error(
        `💥 [ERR] ${route.path.padEnd(18)} — Connection error: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      )
      failed++
    }
  }

  console.log(`\n------------------------------------------------------`)
  console.log(`Summary: ${passed} passed, ${failed} failed out of ${ROUTES_TO_TEST.length} tested routes.`)
  console.log(`------------------------------------------------------\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runSmokeTests()
