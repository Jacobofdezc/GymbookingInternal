/**
 * Calendar link generation utility for Google Calendar, Outlook, and Office 365.
 */

export interface CalendarEventPayload {
  title: string
  description?: string | null
  location?: string | null
  startDate: string // YYYY-MM-DD or ISO string
  startTime?: string | null // HH:mm (e.g. 10:00)
  durationMinutes?: number
}

function pad(num: number): string {
  return String(num).padStart(2, '0')
}

function parseEventDates(payload: CalendarEventPayload): { startStr: string; endStr: string; isAllDay: boolean } {
  const { startDate, startTime, durationMinutes = 60 } = payload

  // Check if it's already an ISO timestamp or date YYYY-MM-DD
  const datePart = startDate.includes('T') ? startDate.split('T')[0] : startDate
  const [yearStr, monthStr, dayStr] = datePart.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1
  const day = parseInt(dayStr, 10)

  if (!startTime) {
    // All-day event: YYYYMMDD/YYYYMMDD (next day)
    const nextDay = new Date(year, month, day + 1)
    const startStr = `${yearStr}${monthStr}${dayStr}`
    const endStr = `${nextDay.getFullYear()}${pad(nextDay.getMonth() + 1)}${pad(nextDay.getDate())}`
    return { startStr, endStr, isAllDay: true }
  }

  // Event with specific time
  const [hoursStr, minsStr] = startTime.split(':')
  const hours = parseInt(hoursStr, 10)
  const mins = parseInt(minsStr, 10)

  const startObj = new Date(year, month, day, hours, mins, 0)
  const endObj = new Date(startObj.getTime() + durationMinutes * 60 * 1000)

  const formatUtcIso = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`

  return {
    startStr: formatUtcIso(startObj),
    endStr: formatUtcIso(endObj),
    isAllDay: false,
  }
}

export function generateGoogleCalendarUrl(payload: CalendarEventPayload): string {
  const { startStr, endStr } = parseEventDates(payload)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: payload.title,
    dates: `${startStr}/${endStr}`,
  })

  if (payload.description) {
    params.set('details', payload.description)
  }

  if (payload.location) {
    params.set('location', payload.location)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function generateOutlookCalendarUrl(payload: CalendarEventPayload): string {
  const { startDate, startTime, durationMinutes = 60 } = payload
  const datePart = startDate.includes('T') ? startDate.split('T')[0] : startDate
  const startIso = startTime ? `${datePart}T${startTime}:00` : `${datePart}T09:00:00`

  const startObj = new Date(startIso)
  const endObj = new Date(startObj.getTime() + durationMinutes * 60 * 1000)

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: payload.title,
    startdt: startObj.toISOString(),
    enddt: endObj.toISOString(),
  })

  if (payload.description) {
    params.set('body', payload.description)
  }

  if (payload.location) {
    params.set('location', payload.location)
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

export function generateIcsContent(payload: CalendarEventPayload): string {
  const { startStr, endStr } = parseEventDates(payload)
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .slice(0, 15) + 'Z'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GymBooking España//Internal CRM//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:gb-${Date.now()}@gymbooking.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${payload.title}`,
    payload.description ? `DESCRIPTION:${payload.description.replace(/\n/g, '\\n')}` : '',
    payload.location ? `LOCATION:${payload.location}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}
