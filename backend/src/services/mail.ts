import { Resend } from 'resend';
import { config } from '../config.js';
import { AppError } from '../lib/errors.js';

let cached: Resend | null = null;

function client(): Resend {
  if (cached) return cached;
  if (!config.RESEND_API_KEY) {
    throw new AppError('MAIL_NOT_CONFIGURED', 'Mail provider not configured', 500);
  }
  cached = new Resend(config.RESEND_API_KEY);
  return cached;
}

function ensureFrom(): string {
  if (!config.RESEND_FROM) {
    throw new AppError('MAIL_NOT_CONFIGURED', 'Mail sender not configured', 500);
  }
  return config.RESEND_FROM;
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const r = await client().emails.send({
    from: ensureFrom(),
    to,
    subject: `Your Plate code is ${code}`,
    text: `Your Plate code is ${code}. It expires in 10 minutes.\n\nIf you didn't ask for this, you can ignore this email.`,
    html: renderHtml(code),
  });
  if (r.error) {
    throw new AppError('MAIL_SEND_FAILED', r.error.message ?? 'Could not send code', 502);
  }
}

function renderHtml(code: string): string {
  // Plain, deliverable HTML — no images, no remote fonts, no tracking.
  return `<!doctype html><html><body style="margin:0;padding:32px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0b0b0a;color:#f6f3e9">
  <p style="font-size:13px;letter-spacing:1.4px;text-transform:uppercase;color:#6f6c61;margin:0 0 16px 0">PLATE</p>
  <p style="font-size:18px;line-height:1.4;margin:0 0 24px 0">Your sign-in code:</p>
  <p style="font-family:Menlo,Consolas,monospace;font-size:38px;letter-spacing:8px;margin:0 0 24px 0;color:#dcff4f">${code}</p>
  <p style="font-size:14px;color:#b8b4a5;margin:0 0 8px 0">It expires in 10 minutes.</p>
  <p style="font-size:13px;color:#6f6c61;margin:24px 0 0 0">If you didn't ask for this, you can ignore this email — nothing happens unless you enter the code.</p>
</body></html>`;
}
