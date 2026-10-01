// Shared SMTP sender used by every Edge Function that emails someone
// (send-registration-email, send-contact-message). One place to swap
// providers or auth details.
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

// The only provider-specific part. To switch providers later (Resend,
// SendGrid's HTTP API, etc.) only this function needs to change.
export async function sendEmail(opts: SendEmailOptions) {
  const hostname = Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") ?? "587");
  const username = Deno.env.get("SMTP_USERNAME");
  const password = Deno.env.get("SMTP_PASSWORD");
  const from = Deno.env.get("MAIL_FROM");
  if (!hostname || !username || !password || !from) {
    throw new Error(
      "Email is not configured (SMTP_HOST / SMTP_USERNAME / SMTP_PASSWORD / MAIL_FROM missing).",
    );
  }
  // Port 465 = implicit TLS (SMTPS). Port 587/25 = STARTTLS, negotiated
  // automatically once connected. Override with SMTP_SECURE=true/false if a
  // provider doesn't follow that convention.
  const secure = (Deno.env.get("SMTP_SECURE") ?? String(port === 465)) === "true";

  const client = new SMTPClient({
    connection: {
      hostname,
      port,
      tls: secure,
      auth: { username, password },
    },
  });

  try {
    await client.send({
      from,
      to: opts.to,
      subject: opts.subject,
      content: opts.text,
      html: opts.html,
      replyTo: opts.replyTo || Deno.env.get("MAIL_REPLY_TO") || undefined,
    });
  } finally {
    // Always close the connection, even if send() throws, so a failed email
    // doesn't leak a socket across invocations.
    await client.close().catch(() => {});
  }
}