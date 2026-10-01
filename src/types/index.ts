import type { LucideIcon } from "lucide-react";

export interface Activity {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface TechNode {
  id: number;
  title: string;
  category: string;
  content: string;
  icon: LucideIcon;
  relatedIds: number[];
}

export interface CoreValue {
  title: string;
  description: string;
}

export interface TeamSocials {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  behance?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  // Portrait URL or a path under /public (e.g. "/team/vansh-shah.jpg").
  // Leave it out and the card falls back to a monogram tile.
  image?: string;
  social?: TeamSocials;
  // Renders the dashed "open position" card that links to /contact.
  vacant?: boolean;
}

export type EventCategory = "Workshops" | "Seminars" | "Competitions" | "Community";

// A titled list shown in the event popup, e.g. "Winners" or "What we covered".
export interface EventHighlights {
  title: string;
  items: string[];
}

export interface ClubEvent {
  id: string;
  title: string;
  date: string;
  year: string;
  category: EventCategory;
  description: string;
  status: "upcoming" | "past";
  // Everything below is optional and only used by the event popup.
  // Longer write-up; falls back to `description` when omitted.
  details?: string;
  // Photo URLs for the popup gallery. When omitted, three "Event photo n of 3"
  // placeholders are shown instead.
  photos?: string[];
  highlights?: EventHighlights;
  // Set for events that come from the database (Supabase):
  // ISO date (yyyy-mm-dd), used for sorting and editing.
  eventDate?: string;
  // Max entries; null/undefined = unlimited. Sign-ups beyond it are waitlisted.
  capacity?: number | null;
  // Spots currently taken (pending + approved entries).
  taken?: number;
  // Admins can close sign-ups without deleting the event.
  registrationOpen?: boolean;
  // The registration form (name + email are always asked on top of these).
  formFields?: FormField[];
  // Optional second form for people from outside the university. When enabled,
  // the sign-up popup shows an "NUV Student / Outside University" toggle.
  outsideFormEnabled?: boolean;
  outsideFormFields?: FormField[];
}

export type FormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "number"
  | "select"
  | "checkbox";

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  // Only for type "select".
  options?: string[];
}

export type RegistrantType = "nuv" | "outside";

export type RegistrationStatus = "pending" | "approved" | "rejected" | "waitlisted";

export interface RegistrationAnswer {
  id: string;
  label: string;
  value: string;
}

export interface Registration {
  id: string;
  eventId: string;
  fullName: string;
  email: string;
  answers: RegistrationAnswer[];
  // Which form they filled in. Older entries (before the outside form existed) are "nuv".
  registrantType: RegistrantType;
  status: RegistrationStatus;
  createdAt: string;
  reviewedAt?: string;
  emailSentAt?: string;
  emailError?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export interface Metric {
  label: string;
  value: number;
  suffix?: string;
  delta: string;
  isLive?: boolean;
}

export interface MissionCard {
  number: string;
  title: string;
  description: string;
  tag: string;
}x