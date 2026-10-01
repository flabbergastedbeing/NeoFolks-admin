// Supabase Edge Function: emails a participant when an admin approves their
// registration. Called by the admin dashboard right after it approves someone.
// Sends over plain SMTP (see ../_shared/email.ts) — works with any mailbox or
// transactional provider that gives you SMTP credentials.
//
// Setup (see supabase/README.md):
//   supabase secrets set SMTP_HOST=... SMTP_PORT=587 SMTP_USERNAME=... \
//                        SMTP_PASSWORD=... MAIL_FROM="NeoFolks <events@yourdomain.com>"
//   supabase functions deploy send-registration-email
//
// Only signed-in ADMINS can call this (checked below), and it only ever emails
// registrations that are currently "approved", so it can't be used to send
// arbitrary mail.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, esc, json, sendEmail } from "../_shared/email.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. Must be a signed-in admin.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Not signed in." }, 401);
  const { data: adminRow } = await supabase
    .from("admins").select("user_id").eq("user_id", userData.user.id).maybeSingle();
  if (!adminRow) return json({ error: "Not authorised." }, 403);

  // 2. Load the registration; only approved ones get an email.
  let registrationId: string | undefined;
  try {
    registrationId = (await req.json()).registration_id;
  } catch { /* handled below */ }
  if (!registrationId) return json({ error: "registration_id is required." }, 400);

  const { data: reg, error: regError } = await supabase
    .from("registrations")
    .select("id, full_name, email, status, events(title, event_date, category)")
    .eq("id", registrationId)
    .maybeSingle();
  if (regError || !reg) return json({ error: "Registration not found." }, 404);
  if (reg.status !== "approved") return json({ error: "Only approved registrations are emailed." }, 409);

  // deno-lint-ignore no-explicit-any
  const event = (reg as any).events as { title: string; event_date: string; category: string };
  const dateLabel = new Date(`${event.event_date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });

  const subject = `You're confirmed: ${event.title}`;
  const text =
`Hi ${reg.full_name},

Good news: your registration for "${event.title}" (${dateLabel}) has been approved. We've saved you a spot.

We look forward to seeing you there.

- The NeoFolks team`;
  const html =
`<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin:0 0 16px;font-weight:600">You're confirmed</h2>
  <p>Hi ${esc(reg.full_name)},</p>
  <p>Good news: your registration for <strong>${esc(event.title)}</strong> has been approved. We've saved you a spot.</p>
  <table style="margin:20px 0;border-collapse:collapse">
    <tr><td style="padding:4px 16px 4px 0;color:#666">Event</td><td>${esc(event.title)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#666">Date</td><td>${esc(dateLabel)}</td></tr>
  </table>
  <p>We look forward to seeing you there.</p>
  <p style="color:#666">- The NeoFolks team</p>
</div>`;

  // 3. Send, and record the outcome so the dashboard can show "sent" / "failed".
  try {
    await sendEmail({ to: reg.email, subject, html, text });
    await supabase.from("registrations")
      .update({ email_sent_at: new Date().toISOString(), email_error: null }).eq("id", reg.id);
    return json({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("registrations").update({ email_error: message }).eq("id", reg.id);
    return json({ sent: false, error: message }, 502);
  }
});