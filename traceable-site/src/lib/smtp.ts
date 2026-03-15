/**
 * SMTP email client using nodemailer.
 *
 * Required env vars:
 *   SMTP_HOST          – e.g. smtp.gmail.com
 *   SMTP_PORT          – e.g. 587
 *   SMTP_USER          – e.g. alerts@yourcompany.com
 *   SMTP_PASS          – app password or SMTP password
 *   SMTP_FROM          – sender address shown in email
 *   SALES_TEAM_EMAIL   – recipient(s), comma-separated
 */

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? '',
  port: parseInt(process.env.SMTP_PORT ?? '587', 10),
  secure: parseInt(process.env.SMTP_PORT ?? '587', 10) === 465,
  auth: {
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
  },
});

export async function sendEmail(params: {
  to?: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const to = params.to ?? process.env.SALES_TEAM_EMAIL ?? '';

  if (!to) {
    return { success: false, error: 'No recipient configured (SALES_TEAM_EMAIL)' };
  }

  if (!process.env.SMTP_HOST) {
    return { success: false, error: 'SMTP_HOST not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'alerts@traceable.app',
      to,
      subject: params.subject,
      html: params.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[smtp] Send failed:', message);
    return { success: false, error: message };
  }
}
