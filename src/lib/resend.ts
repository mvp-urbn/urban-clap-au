import { Resend } from 'resend';

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'missing');
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'Urban Clap AU <onboarding@resend.dev>';
