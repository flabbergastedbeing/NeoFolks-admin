// Supabase Edge Function: emails the club's own inbox when a visitor submits
// the public Contact form. Sends over plain SMTP (see ../_shared/email.ts).
//
// Setup (see supabase/README.md):
//   supabase secrets set CONTACT_TO_EMAIL=neofolks@yourdomain.com   (optional;
//     defaults to SMTP_USERNAME if not set)
//   supabase functions deploy send-contact-message --no-verify-jwt
//
// This is called by anonymous visitors (there's no login on the Contact
// page), so unlike send-registration-email it does NOT check for an admin.
// To stop it being used to relay arbitrary mail, the "to" address is always
// your own fixed inbox — never something the caller can choose. The
// visitor's address is only ever used as the reply-to, so hitting "Reply" in
// your inbox goes straight back to them.
import { corsHeaders, esc, json, sendEmail } from "../_shared/email.ts";

const SUBJECT_LABELS: Record<string, string> = {
  join: "Join the club",
  collaborate: "Collaborate",
  general: "General question",
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { name?: unknown; email?: unknown; subject?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  // Mirrors the zod schema on the frontend (src/lib/schemas.ts) — the
  // frontend already validates this, but the function must too, since it can
  // be called directly (e.g. with the public anon key) bypassing the form.
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subjectKey = typeof body.subject === "string" ? body.subject : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 2 || name.length > 200) {
    return json({ error: "Name must be between 2 and 200 characters." }, 400);
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: "Enter a valid email address." }, 400);
  }
  if (!(subjectKey in SUBJECT_LABELS)) {
    return json({ error: "Select a valid subject." }, 400);
  }
  if (message.length < 10 || message.length > 1000) {
    return json({ error: "Message must be between 10 and 1000 characters." }, 400);
  }

  const to = Deno.env.get("CONTACT_TO_EMAIL") || Deno.env.get("SMTP_USERNAME");
  if (!to) {
    return json(
      { error: "Contact inbox is not configured (CONTACT_TO_EMAIL / SMTP_USERNAME missing)." },
      500,
    );
  }

  const subjectLabel = SUBJECT_LABELS[subjectKey];
  const subject = `[NeoFolks Contact] ${subjectLabel} — ${name}`;
  const text =
`New message from the NeoFolks contact form.

Name: ${name}
Email: ${email}
Subject: ${subjectLabel}

${message}

(Reply to this email to respond directly to ${name}.)`;
  const html =
`<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin:0 0 16px;font-weight:600">New contact message</h2>
  <table style="margin:0 0 20px;border-collapse:collapse">
    <tr><td style="padding:4px 16px 4px 0;color:#666">Name</td><td>${esc(name)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#666">Email</td><td>${esc(email)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#666">Subject</td><td>${esc(subjectLabel)}</td></tr>
  </table>
  <p style="white-space:pre-wrap">${esc(message)}</p>
  <p style="color:#666;margin-top:24px">Reply to this email to respond directly to ${esc(name)}.</p>
</div>`;

  try {
    await sendEmail({ to, subject, html, text, replyTo: email });
    return json({ sent: true });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return json({ sent: false, error: errMessage }, 502);
  }
});