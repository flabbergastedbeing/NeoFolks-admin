import type { ClubEvent, EventCategory, FormField, Registration, RegistrantType } from "@/types";

export interface EmailResult {
  sent: boolean;
  error?: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: "join" | "collaborate" | "general";
  message: string;
}

// ---- Errors -------------------------------------------------------------------
export type BackendErrorCode =
  | "NOT_CONFIGURED"
  | "EVENT_FULL"
  | "ALREADY_REGISTERED"
  | "REGISTRATION_CLOSED"
  | "OUTSIDE_NOT_ALLOWED"
  | "EVENT_NOT_FOUND"
  | "INVALID_EMAIL"
  | "INVALID_NAME"
  | "FIELD_REQUIRED"
  | "FIELD_INVALID"
  | "NOT_AUTHORISED"
  | "UNKNOWN";

export class BackendError extends Error {
  code: BackendErrorCode;

  constructor(code: BackendErrorCode, message: string) {
    super(message);
    this.name = "BackendError";
    this.code = code;
  }
}

// ---- Admin session --------------------------------------------------------------
export type AdminSessionState =
  | { status: "signedOut" }
  | { status: "notAdmin"; email: string }
  | { status: "admin"; email: string };

// ---- Public registration --------------------------------------------------------
export interface SubmitRegistrationInput {
  eventId: string;
  fullName: string;
  email: string;
  registrantType: RegistrantType;
  answers: Record<string, string | boolean>;
}

export interface SubmitRegistrationResult {
  status: "pending" | "waitlisted";
  waitlistPosition: number | null;
}

// ---- Admin: events ----------------------------------------------------------------
export interface EventInput {
  id?: string;
  title: string;
  category: EventCategory;
  status: "upcoming" | "past";
  eventDate: string;
  description: string;
  details: string;
  photos: string[];
  highlightsTitle: string;
  highlightsItems: string[];
  capacity: number | null;
  registrationOpen: boolean;
  formFields: FormField[];
  outsideFormEnabled: boolean;
  outsideFormFields: FormField[];
}

// ---- Admin: registrations ----------------------------------------------------------
export type ReviewAction = "approve" | "reject";

export interface Backend {
  // False when the Supabase env vars aren't set: the public site then falls
  // back to its built-in sample events, and registration/admin are unavailable.
  configured: boolean;

  // ---- Public ----
  listEvents(): Promise<ClubEvent[]>;
  submitRegistration(input: SubmitRegistrationInput): Promise<SubmitRegistrationResult>;
  submitContactMessage(input: ContactMessageInput): Promise<EmailResult>;

  // ---- Admin sign-in ----
  auth: {
    getSession(): Promise<AdminSessionState>;
    onChange(callback: () => void): () => void;
    signIn(email: string, password: string): Promise<void>;
    signOut(): Promise<void>;
  };

  // ---- Admin (all of these are enforced server-side, not just hidden in the UI) ----
  admin: {
    saveEvent(input: EventInput): Promise<ClubEvent>;
    deleteEvent(id: string): Promise<void>;
    uploadPhoto(file: File): Promise<string>;
    listRegistrations(eventId: string): Promise<Registration[]>;
    reviewRegistration(id: string, action: ReviewAction): Promise<Registration>;
    sendApprovalEmail(id: string): Promise<EmailResult>;
  };
}