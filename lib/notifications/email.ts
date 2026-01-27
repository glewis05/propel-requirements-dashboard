import { Resend } from "resend"

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn("Resend API key not configured - email not sent")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Propel Health <notifications@propelhealth.com>",
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      console.error("Failed to send email:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("Email send error:", err)
    return { success: false, error: "Failed to send email" }
  }
}

// Email templates
export function generateStatusChangeEmail(params: {
  storyId: string
  storyTitle: string
  previousStatus: string
  newStatus: string
  changedBy: string
  notes?: string
  dashboardUrl: string
}): { subject: string; html: string; text: string } {
  const { storyId, storyTitle, previousStatus, newStatus, changedBy, notes, dashboardUrl } = params
  const storyUrl = `${dashboardUrl}/stories/${storyId}`

  const subject = `[${storyId}] Status changed to ${newStatus}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Status Change Notification</title>
</head>
<body style="font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #34353F; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0C8181; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">📋 Story Status Update</h1>
  </div>

  <div style="background: #f8fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="margin-top: 0;">A story you're tracking has been updated:</p>

    <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-family: monospace;">${storyId}</p>
      <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #34353F;">${storyTitle}</h2>

      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="background: #e5e7eb; padding: 4px 12px; border-radius: 20px; font-size: 13px;">${previousStatus}</span>
        <span style="color: #6b7280;">→</span>
        <span style="background: #0C8181; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px;">${newStatus}</span>
      </div>

      <p style="margin: 0; font-size: 14px; color: #6b7280;">Changed by: ${changedBy}</p>
    </div>

    ${notes ? `
    <div style="background: #fef3c7; padding: 12px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #F9BC15;">
      <p style="margin: 0; font-size: 14px;"><strong>Notes:</strong> ${notes}</p>
    </div>
    ` : ''}

    <a href="${storyUrl}" style="display: inline-block; background: #0C8181; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 8px;">View Story</a>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

    <p style="font-size: 12px; color: #6b7280; margin: 0;">
      You're receiving this because you have notifications enabled for status changes.
      <a href="${dashboardUrl}/settings/notifications" style="color: #0C8181;">Manage notification preferences</a>
    </p>
  </div>

  <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 16px;">
    Powered by Propel Health Platform
  </p>
</body>
</html>
`

  const text = `
Story Status Update

${storyId}: ${storyTitle}

Status changed: ${previousStatus} → ${newStatus}
Changed by: ${changedBy}
${notes ? `\nNotes: ${notes}` : ''}

View story: ${storyUrl}

---
You're receiving this because you have notifications enabled for status changes.
Manage preferences: ${dashboardUrl}/settings/notifications
`

  return { subject, html, text }
}
