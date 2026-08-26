// Outbound mail for the site's two senders (the contact form and the moveout
// listing page). Delivery is best-effort by design: every caller persists its
// payload to disk BEFORE calling here, so a send failure is logged and never
// surfaced to the visitor.
//
// Resend's HTTPS API is the primary path because Railway blocks outbound SMTP
// below the Pro plan. SMTP_* remains as a fallback for running anywhere else.
export const CONTACT_TO = process.env.CONTACT_TO || 'drewtbermudez@gmail.com';

// `fromName` is the display name only — the envelope address must stay one
// Resend controls (SPF/DMARC forbids sending as an arbitrary visitor), so
// `replyTo` is what actually routes a reply back to them.
export async function sendMail({ subject, text, fromName = 'drewbermudez.com', replyTo }) {
  if (process.env.RESEND_API_KEY) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${String(fromName).replace(/["<>]/g, '')} <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`,
          to: [CONTACT_TO],
          ...(replyTo ? { reply_to: replyTo } : {}),
          subject,
          text,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) {
        console.error('resend send failed:', r.status, await r.text());
        return false;
      }
      return true;
    } catch (err) {
      console.error('resend send failed:', err);
      return false;
    }
  }

  if (process.env.SMTP_HOST) {
    try {
      const { default: nodemailer } = await import('nodemailer');
      // Railway containers have no public IPv6 route, and Gmail's SMTP DNS
      // returns AAAA records first (connect ENETUNREACH) — resolve an IPv4
      // address explicitly and keep the hostname for TLS verification.
      const { resolve4 } = await import('node:dns/promises');
      const [ipv4] = await resolve4(process.env.SMTP_HOST);
      const transport = nodemailer.createTransport({
        host: ipv4,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        tls: { servername: process.env.SMTP_HOST },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });
      await transport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: CONTACT_TO,
        ...(replyTo ? { replyTo } : {}),
        subject,
        text,
      });
      return true;
    } catch (err) {
      console.error('smtp send failed:', err);
      return false;
    }
  }

  console.warn('no mail transport configured (set RESEND_API_KEY or SMTP_HOST) — skipped:', subject);
  return false;
}
