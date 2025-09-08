import { config } from '../config';

function toE164US(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return `+1${digits}`;
}

export async function sendVerificationCode(phone: string): Promise<void> {
  const e164 = toE164US(phone);
  const url = (config as any).twilio?.startUrl;
  if (!url) {
    // Dev fallback: simulate network call
    await new Promise((r) => setTimeout(r, 300));
    return;
  }
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: e164 }),
  }).then(async (r) => {
    if (!r.ok) throw new Error('Failed to start verification');
  });
}

export async function verifyCode(phone: string, code: string): Promise<boolean> {
  const e164 = toE164US(phone);
  const url = (config as any).twilio?.checkUrl;
  if (!url) {
    await new Promise((r) => setTimeout(r, 300));
    // Dev fallback: accept 123456
    return code.trim() === '123456';
  }
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: e164, code: code.trim() }),
  });
  if (!resp.ok) return false;
  try {
    const json = await resp.json();
    return !!json?.approved;
  } catch {
    return false;
  }
}


