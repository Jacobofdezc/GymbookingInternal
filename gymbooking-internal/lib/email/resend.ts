/**
 * GymBooking Transactional Email Service
 * Integrates with Resend REST API with graceful fallback when API key is not configured.
 */

interface SendInvitationEmailParams {
  to: string
  role: string
  inviterName?: string | null
  inviteUrl: string
  orgName?: string
}

interface EmailResult {
  success: boolean
  provider: 'resend' | 'fallback'
  messageId?: string
  error?: string
}

const ROLE_NAME_ES: Record<string, string> = {
  admin: 'Administrador',
  commercial: 'Comercial / Ventas',
  operations: 'Operaciones e Integraciones',
  viewer: 'Observador (Solo lectura)',
}

export async function sendInvitationEmail({
  to,
  role,
  inviterName,
  inviteUrl,
  orgName = 'GymBooking España',
}: SendInvitationEmailParams): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'GymBooking Internal <onboarding@resend.dev>'

  const roleLabel = ROLE_NAME_ES[role] || role
  const senderDisplay = inviterName ? `${inviterName} de ${orgName}` : orgName

  if (!apiKey) {
    console.warn(
      `[Email Service] RESEND_API_KEY no está configurada en las variables de entorno. ` +
      `Invitación para "${to}" disponible en enlace directo: ${inviteUrl}`
    )
    return {
      success: false,
      provider: 'fallback',
      error: 'RESEND_API_KEY no configurada. Usa el enlace manual de invitación.',
    }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Invitación a GymBooking Internal</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .logo { font-size: 20px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; margin-bottom: 24px; display: inline-block; }
        h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; }
        .role-badge { display: inline-block; padding: 4px 12px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 8px; font-weight: 700; font-size: 12px; margin-bottom: 24px; }
        .button { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; margin: 16px 0 24px 0; }
        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }
        .url-box { background: #f1f5f9; padding: 10px 14px; border-radius: 8px; font-family: monospace; font-size: 11px; word-break: break-all; color: #334155; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">⚡ GymBooking Internal</div>
        <h1>¡Hola! Has sido invitado al equipo</h1>
        <p><strong>${senderDisplay}</strong> te ha invitado a unirte al centro de operaciones interno de <strong>${orgName}</strong>.</p>
        
        <div>
          Rol asignado: <span class="role-badge">${roleLabel}</span>
        </div>

        <p>Para activar tu cuenta y configurar tu contraseña de acceso seguro, pulsa en el botón inferior:</p>

        <a href="${inviteUrl}" class="button" target="_blank">Aceptar Invitación y Crear Cuenta</a>

        <p style="font-size: 12px; color: #64748b; margin-top: 16px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <div class="url-box">${inviteUrl}</div>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} GymBooking España. Este es un correo transaccional automático.
      </div>
    </body>
    </html>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: `Invitación para unirte al equipo de ${orgName}`,
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[Resend Error]', res.status, errBody)
      return {
        success: false,
        provider: 'resend',
        error: `Error de Resend (${res.status}): ${errBody}`,
      }
    }

    const data = await res.json()
    return {
      success: true,
      provider: 'resend',
      messageId: data.id,
    }
  } catch (err: any) {
    console.error('[Resend Exception]', err)
    return {
      success: false,
      provider: 'resend',
      error: err.message || 'Error de conexión con Resend',
    }
  }
}
