import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { formatEventDate } from "@/lib/dates";
import type { ClubEvent, EventCategory, FormField, Registration, RegistrationStatus, RegistrantType } from "@/types";
import {
  BackendError,
  type AdminSessionState,
  type Backend,
  type BackendErrorCode,
  type ContactMessageInput,
  type EmailResult,
  type EventInput,
  type ReviewAction,
  type SubmitRegistrationInput,
  type SubmitRegistrationResult,
} from "./types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const client: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function db(): SupabaseClient {
  if (!client) {
    throw new BackendError(
      "NOT_CONFIGURED",
      "Supabase isn't set up yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.",
    );
  }
  return client;
}

// ---- Errors -----------------------------------------------------------------
// The database raises short codes ("EVENT_FULL", "FIELD_REQUIRED: Department").
// Turn them into sentences a person can act on.
const KNOWN_CODES: BackendErrorCode[] = [
  "EVENT_FULL",
  "ALREADY_REGISTERED",
  "REGISTRATION_CLOSED",
  "OUTSIDE_NOT_ALLOWED",
  "EVENT_NOT_FOUND",
  "INVALID_EMAIL",
  "INVALID_NAME",
  "FIELD_REQUIRED",
  "FIELD_INVALID",
  "NOT_AUTHORISED",
];

function toBackendError(error: { message?: string } | null | undefined): BackendError {
  const raw = error?.message ?? "";
  const code = KNOWN_CODES.find((c) => raw.startsWith(c));
  const detail = raw.includes(":") ? raw.slice(raw.indexOf(":") + 1).trim() : "";

  switch (code) {
    case "EVENT_FULL":
      return new BackendError(code, "This event is full. Raise the entry limit or reject an entry to free a spot.");
    case "ALREADY_REGISTERED":
      return new BackendError(code, "This email address is already registered for this event.");
    case "REGISTRATION_CLOSED":
      return new BackendError(code, "Registration for this event is closed.");
    case "OUTSIDE_NOT_ALLOWED":
      return new BackendError(code, "This event isn't open to registrations from outside the university.");
    case "EVENT_NOT_FOUND":
      return new BackendError(code, "This event no longer exists.");
    case "INVALID_EMAIL":
      return new BackendError(code, "Please enter a valid email address.");
    case "INVALID_NAME":
      return new BackendError(code, "Please enter your name.");
    case "FIELD_REQUIRED":
      return new BackendError(code, `${detail || "A required field"} is required.`);
    case "FIELD_INVALID":
      return new BackendError(code, `${detail || "A field"} isn't valid.`);
    case "NOT_AUTHORISED":
      return new BackendError(code, "You don't have permission to do that.");
    default:
      return new BackendError("UNKNOWN", raw || "Something went wrong. Please try again.");
  }
}

function assertOk<T>(result: { data: T | null; error: { message?: string } | null }): T {
  if (result.error) throw toBackendError(result.error);
  return result.data as T;
}

// ---- Row <-> app shapes -------------------------------------------------------
/* eslint-disable @typescript-eslint/no-explicit-any */
function mapEvent(row: any): ClubEvent {
  const items: string[] = row.highlights_items ?? [];
  const photos: string[] = row.photos ?? [];
  return {
    id: row.id,
    title: row.title,
    date: formatEventDate(row.event_date),
    year: String(row.event_date).slice(0, 4),
    eventDate: row.event_date,
    category: row.category as EventCategory,
    description: row.description ?? "",
    status: row.status,
    details: row.details || undefined,
    photos: photos.length > 0 ? photos : undefined,
    highlights:
      items.length > 0 ? { title: row.highlights_title || "Highlights", items } : undefined,
    capacity: row.capacity ?? null,
    taken: row.taken ?? 0,
    registrationOpen: row.registration_open ?? true,
    formFields: (row.form_fields ?? []) as FormField[],
    outsideFormEnabled: row.outside_form_enabled ?? false,
    outsideFormFields: (row.outside_form_fields ?? []) as FormField[],
  };
}

function mapRegistration(row: any): Registration {
  return {
    id: row.id,
    eventId: row.event_id,
    fullName: row.full_name,
    email: row.email,
    answers: row.answers ?? [],
    registrantType: (row.registrant_type ?? "nuv") as RegistrantType,
    status: row.status as RegistrationStatus,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? undefined,
    emailSentAt: row.email_sent_at ?? undefined,
    emailError: row.email_error ?? undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function eventRow(input: EventInput) {
  return {
    title: input.title.trim(),
    category: input.category,
    status: input.status,
    event_date: input.eventDate,
    description: input.description.trim(),
    details: input.details.trim() || null,
    photos: input.photos,
    highlights_title: input.highlightsTitle.trim() || null,
    highlights_items: input.highlightsItems.map((i) => i.trim()).filter(Boolean),
    capacity: input.capacity,
    registration_open: input.registrationOpen,
    form_fields: input.formFields,
    outside_form_enabled: input.outsideFormEnabled,
    outside_form_fields: input.outsideFormFields,
  };
}

// ---- Admin session ------------------------------------------------------------
async function getSession(): Promise<AdminSessionState> {
  if (!client) return { status: "signedOut" };
  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  if (!user) return { status: "signedOut" };

  // Being signed in isn't enough: the user must be listed in `admins`.
  const { data: row } = await client
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const email = user.email ?? "";
  return row ? { status: "admin", email } : { status: "notAdmin", email };
}

// ---- The backend --------------------------------------------------------------
export const supabaseBackend: Backend = {
  configured: client !== null,

  async listEvents() {
    const rows = assertOk(
      await db().from("events_public").select("*").order("event_date", { ascending: false }),
    );
    return (rows as unknown[]).map(mapEvent);
  },

  async submitRegistration(input: SubmitRegistrationInput): Promise<SubmitRegistrationResult> {
    const data = assertOk(
      await db().rpc("submit_registration", {
        p_event_id: input.eventId,
        p_full_name: input.fullName,
        p_email: input.email,
        p_answers: input.answers,
        p_registrant_type: input.registrantType,
      }),
    ) as { status: "pending" | "waitlisted"; waitlist_position: number | null };
    return { status: data.status, waitlistPosition: data.waitlist_position ?? null };
  },

  async submitContactMessage(input: ContactMessageInput): Promise<EmailResult> {
    const { data, error } = await db().functions.invoke("send-contact-message", {
      body: input,
    });
    if (!error) return { sent: Boolean(data?.sent) };

    // Edge Function errors carry the JSON body on `error.context`.
    let message = "The message couldn't be sent. Please try again.";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = body.error;
    } catch {
      /* keep the generic message */
    }
    throw new BackendError("UNKNOWN", message);
  },

  auth: {
    getSession,
    onChange(callback) {
      if (!client) return () => {};
      // Deferred on purpose: calling back into Supabase synchronously from inside
      // this listener can deadlock supabase-js's auth lock.
      const { data } = client.auth.onAuthStateChange(() => {
        setTimeout(callback, 0);
      });
      return () => data.subscription.unsubscribe();
    },
    async signIn(email, password) {
      const { error } = await db().auth.signInWithPassword({ email, password });
      if (error) {
        throw new BackendError("UNKNOWN", "That email and password don't match. Please try again.");
      }
    },
    async signOut() {
      await db().auth.signOut();
    },
  },

  admin: {
    async saveEvent(input) {
      const row = eventRow(input);
      const query = input.id
        ? db().from("events").update(row).eq("id", input.id)
        : db().from("events").insert(row);
      const saved = assertOk<Record<string, unknown>>(await query.select().single());
      return mapEvent({ ...saved, taken: 0 });
    },

    async deleteEvent(id) {
      assertOk(await db().from("events").delete().eq("id", id).select("id"));
    },

    async uploadPhoto(file) {
      if (!file.type.startsWith("image/")) {
        throw new BackendError("UNKNOWN", "Please choose an image file.");
      }
      if (file.size > MAX_PHOTO_BYTES) {
        throw new BackendError("UNKNOWN", "Images must be 5 MB or smaller.");
      }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${crypto.randomUUID()}.${ext}`;
      const storage = db().storage.from("event-photos");
      const { error } = await storage.upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
      });
      if (error) throw new BackendError("UNKNOWN", `Couldn't upload the image: ${error.message}`);
      return storage.getPublicUrl(path).data.publicUrl;
    },

    async listRegistrations(eventId) {
      const rows = assertOk(
        await db()
          .from("registrations")
          .select("*")
          .eq("event_id", eventId)
          .order("created_at", { ascending: true }),
      );
      return (rows as unknown[]).map(mapRegistration);
    },

    async reviewRegistration(id, action: ReviewAction) {
      const row = assertOk(await db().rpc("review_registration", { p_id: id, p_action: action }));
      return mapRegistration(row);
    },

    async sendApprovalEmail(id): Promise<EmailResult> {
      const { data, error } = await db().functions.invoke("send-registration-email", {
        body: { registration_id: id },
      });
      if (!error) return { sent: Boolean(data?.sent) };

      // Edge Function errors carry the JSON body on `error.context`.
      let message = "The email couldn't be sent.";
      try {
        const body = await (error as { context?: Response }).context?.json();
        if (body?.error) message = body.error;
      } catch {
        /* keep the generic message */
      }
      return { sent: false, error: message };
    },
  },
};