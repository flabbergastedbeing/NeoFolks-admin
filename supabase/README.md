## 4. Approval emails

Supabase can't send arbitrary email on its own, so approvals go through a small
Edge Function (`supabase/functions/send-registration-email`) that connects over
**SMTP** and sends the confirmation directly — no third-party email API
required. It works with any mailbox or transactional provider that gives you
SMTP credentials: a Gmail account (with an **App Password**), Zoho, Outlook365,
your own mail server, or the SMTP relay of a provider like Brevo, Mailgun or
SendGrid.

1. Get SMTP credentials from wherever you're sending from:
   - **Gmail**: turn on 2-Step Verification, then create an **App Password**
     (myaccount.google.com → Security → App passwords). Host is
     `smtp.gmail.com`, port `587`.
   - **A transactional provider** (Brevo, Mailgun, SendGrid, etc.): their
     dashboard has an "SMTP" or "SMTP relay" section with a host, port, and a
     username/password pair — use those instead of their HTTP API key.
   - **Your own domain's mailbox** (e.g. via your host or Zoho Mail): use the
     host/port/credentials they give you for outgoing mail.
2. Install the Supabase CLI and deploy the function (run from the project root):

```bash
   npx supabase login
   npx supabase link --project-ref YOUR-PROJECT-REF      # the xxxxxxxx in your project URL
   npx supabase secrets set \
     SMTP_HOST=smtp.yourprovider.com \
     SMTP_PORT=587 \
     SMTP_USERNAME=you@yourdomain.com \
     SMTP_PASSWORD=your-smtp-password \
     MAIL_FROM="NeoFolks <events@yourdomain.com>"
   npx supabase functions deploy send-registration-email --no-verify-jwt
```

   `--no-verify-jwt` is fine here: the function checks for itself that the caller
   is a signed-in admin, and it only ever emails registrations that are
   *approved*. Optionally also set:
   - `MAIL_REPLY_TO=you@yourdomain.com` so replies reach a real inbox.
   - `SMTP_SECURE=true` if your provider uses implicit TLS on a port other than
     `465` (port `465` is treated as implicit TLS automatically; `587`/`25` use
     STARTTLS automatically).

If an email fails (wrong credentials, provider blocked, etc.), the entry
**stays approved**, the dashboard shows "Email failed" with the reason, and a
**Resend email** button lets you retry once it's fixed.

Want to switch to an HTTP-based provider instead (Resend, SendGrid, Brevo)?
Only the `sendEmail()` function at the top of `index.ts` needs to change.