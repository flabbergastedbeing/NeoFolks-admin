import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldsEditor } from "@/components/admin/FormFieldsEditor";
import { useSaveEvent } from "@/hooks/useAdmin";
import { backend, type EventInput } from "@/lib/backend";
import { defaultFormFields, defaultOutsideFormFields, validateFormFields } from "@/lib/formFields";
import type { ClubEvent, EventCategory, FormField } from "@/types";

const CATEGORIES: EventCategory[] = ["Workshops", "Seminars", "Competitions", "Community"];

interface Draft {
  title: string;
  category: EventCategory;
  status: "upcoming" | "past";
  eventDate: string;
  description: string;
  details: string;
  photos: string[];
  highlightsTitle: string;
  highlightsText: string; // one item per line
  capacityText: string; // empty = unlimited
  registrationOpen: boolean;
  formFields: FormField[];
  outsideFormEnabled: boolean;
  outsideFormFields: FormField[];
}

// Trim labels/options so what gets saved is clean.
function cleanFields(fields: FormField[]): FormField[] {
  return fields.map((f) => ({
    id: f.id,
    label: f.label.trim(),
    type: f.type,
    required: f.required,
    ...(f.type === "select"
      ? { options: (f.options ?? []).map((o) => o.trim()).filter(Boolean) }
      : {}),
  }));
}

function toDraft(event: ClubEvent | null): Draft {
  if (!event) {
    return {
      title: "",
      category: "Workshops",
      status: "upcoming",
      eventDate: "",
      description: "",
      details: "",
      photos: [],
      highlightsTitle: "",
      highlightsText: "",
      capacityText: "",
      registrationOpen: true,
      formFields: defaultFormFields(),
      outsideFormEnabled: false,
      outsideFormFields: defaultOutsideFormFields(),
    };
  }
  return {
    title: event.title,
    category: event.category,
    status: event.status,
    eventDate: event.eventDate ?? "",
    description: event.description,
    details: event.details ?? "",
    photos: event.photos ?? [],
    highlightsTitle: event.highlights?.title ?? "",
    highlightsText: (event.highlights?.items ?? []).join("\n"),
    capacityText: event.capacity != null ? String(event.capacity) : "",
    registrationOpen: event.registrationOpen ?? true,
    formFields: event.formFields ?? [],
    outsideFormEnabled: event.outsideFormEnabled ?? false,
    outsideFormFields: event.outsideFormFields ?? [],
  };
}

// Returns the ready-to-save input, or a message saying what to fix.
function toInput(draft: Draft, id: string | undefined): EventInput | string {
  if (!draft.title.trim()) return "Give the event a title.";
  if (!draft.eventDate) return "Pick the event date.";
  if (!draft.description.trim()) return "Add a short description (it appears on the event card).";

  let capacity: number | null = null;
  if (draft.capacityText.trim() !== "") {
    const n = Number(draft.capacityText);
    if (!Number.isInteger(n) || n < 1) return "The entry limit must be a whole number above 0, or left empty for no limit.";
    capacity = n;
  }

  const formProblem = draft.status === "upcoming" ? validateFormFields(draft.formFields) : null;
  if (formProblem) return formProblem;

  const outsideProblem =
    draft.status === "upcoming" && draft.outsideFormEnabled
      ? validateFormFields(draft.outsideFormFields)
      : null;
  if (outsideProblem) return `Outside university form: ${outsideProblem}`;

  const formFields = cleanFields(draft.formFields);
  const outsideFormFields = cleanFields(draft.outsideFormFields);

  return {
    id,
    title: draft.title,
    category: draft.category,
    status: draft.status,
    eventDate: draft.eventDate,
    description: draft.description,
    details: draft.details,
    photos: draft.photos,
    highlightsTitle: draft.highlightsTitle,
    highlightsItems: draft.highlightsText.split("\n"),
    capacity,
    registrationOpen: draft.registrationOpen,
    formFields,
    outsideFormEnabled: draft.outsideFormEnabled,
    outsideFormFields,
  };
}

interface EventEditorProps {
  event: ClubEvent | null; // null = adding a new event
  onClose: () => void;
}

export function EventEditor({ event, onClose }: EventEditorProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(event));
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const save = useSaveEvent();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await backend.admin.uploadPhoto(file);
        setDraft((d) => ({ ...d, photos: [...d.photos, url] }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't upload the image.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = toInput(draft, event?.id);
    if (typeof input === "string") {
      setError(input);
      return;
    }
    setError(null);
    try {
      await save.mutateAsync(input);
      toast.success(event ? "Event updated" : "Event added");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the event.");
    }
  };

  const isUpcoming = draft.status === "upcoming";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-32">
      <div className="flex flex-wrap items-center justify-between gap-12">
        <h2 className="font-alpha-lyrae text-heading-sm font-normal text-ghost-white">
          {event ? "Edit event" : "Add event"}
        </h2>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <Section title="Basics">
        <Row label="Title" htmlFor="ev-title">
          <Input id="ev-title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
        </Row>

        <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
          <Row label="Category" htmlFor="ev-category">
            <Select value={draft.category} onValueChange={(v) => set("category", v as EventCategory)}>
              <SelectTrigger id="ev-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Status" htmlFor="ev-status">
            <Select
              value={draft.status}
              onValueChange={(v) => set("status", v as "upcoming" | "past")}
            >
              <SelectTrigger id="ev-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="Date" htmlFor="ev-date">
            <Input
              id="ev-date"
              type="date"
              value={draft.eventDate}
              onChange={(e) => set("eventDate", e.target.value)}
              className="[color-scheme:dark]"
            />
          </Row>
        </div>

        <Row label="Short description" htmlFor="ev-desc" hint="Shown on the event card.">
          <Textarea
            id="ev-desc"
            className="min-h-[80px]"
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Row>
      </Section>

      <Section title="Popup content" hint="What people see when they open the event.">
        <Row label="Full description" htmlFor="ev-details" hint="Optional. Falls back to the short description.">
          <Textarea
            id="ev-details"
            value={draft.details}
            onChange={(e) => set("details", e.target.value)}
          />
        </Row>

        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
          <Row label="List heading" htmlFor="ev-hl-title" hint='For example "Winners" or "What we covered".'>
            <Input
              id="ev-hl-title"
              value={draft.highlightsTitle}
              onChange={(e) => set("highlightsTitle", e.target.value)}
            />
          </Row>
          <Row label="List items" htmlFor="ev-hl-items" hint="One per line.">
            <Textarea
              id="ev-hl-items"
              className="min-h-[88px]"
              value={draft.highlightsText}
              onChange={(e) => set("highlightsText", e.target.value)}
            />
          </Row>
        </div>

        <div className="flex flex-col gap-8">
          <Label>Photos</Label>
          <div className="flex flex-wrap gap-12">
            {draft.photos.map((url) => (
              <div
                key={url}
                className="relative h-[88px] w-[88px] overflow-hidden rounded-input border border-graphite"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => set("photos", draft.photos.filter((p) => p !== url))}
                  className="absolute right-4 top-4 flex h-20 w-20 items-center justify-center rounded-full bg-black/70 text-ghost-white hover:bg-black"
                >
                  <X className="h-12 w-12" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
              className="flex h-[88px] w-[88px] flex-col items-center justify-center gap-4 rounded-input border border-dashed border-steel-gray text-caption text-ash-gray transition-colors duration-200 hover:border-ghost-white hover:text-ghost-white disabled:opacity-50"
            >
              <ImagePlus className="h-20 w-20" aria-hidden="true" />
              {uploading ? "Uploading…" : "Add"}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => void onFiles(e.target.files)}
            />
          </div>
          <p className="text-caption text-steel-gray">
            JPG, PNG or WebP, up to 5 MB each. Without photos the popup shows placeholders.
          </p>
        </div>
      </Section>

      <Section
        title="Registration"
        hint={
          isUpcoming
            ? "Visitors can register for upcoming events from the event popup."
            : "Registration only applies to upcoming events. Set the status to Upcoming to configure it."
        }
      >
        {isUpcoming && (
          <>
            <div className="grid grid-cols-1 items-end gap-16 md:grid-cols-2">
              <Row
                label="Entry limit"
                htmlFor="ev-capacity"
                hint="Sign-ups beyond this go on the waitlist. Leave empty for no limit."
              >
                <Input
                  id="ev-capacity"
                  inputMode="numeric"
                  placeholder="No limit"
                  value={draft.capacityText}
                  onChange={(e) => set("capacityText", e.target.value)}
                />
              </Row>
              <label className="flex cursor-pointer items-center gap-12 pb-8 text-body-sm text-ghost-white">
                <input
                  type="checkbox"
                  className="h-16 w-16 cursor-pointer accent-lavender-pulse"
                  checked={draft.registrationOpen}
                  onChange={(e) => set("registrationOpen", e.target.checked)}
                />
                Registration is open
              </label>
            </div>

            <label className="flex cursor-pointer items-start gap-12 text-body-sm text-ghost-white">
              <input
                type="checkbox"
                className="mt-[3px] h-16 w-16 shrink-0 cursor-pointer accent-lavender-pulse"
                checked={draft.outsideFormEnabled}
                onChange={(e) => set("outsideFormEnabled", e.target.checked)}
              />
              <span>
                Also accept registrations from outside the university
                <span className="mt-4 block text-caption text-steel-gray">
                  Adds an “NUV Student / Outside University” toggle to the sign-up form, with its own
                  questions below. Both groups share the entry limit.
                </span>
              </span>
            </label>

            <div className="flex flex-col gap-8">
              <Label>
                {draft.outsideFormEnabled ? "Registration form · NUV students" : "Registration form"}
              </Label>
              <FormFieldsEditor fields={draft.formFields} onChange={(f) => set("formFields", f)} />
            </div>

            {draft.outsideFormEnabled && (
              <div className="flex flex-col gap-8">
                <Label>Registration form · Outside university</Label>
                <FormFieldsEditor
                  fields={draft.outsideFormFields}
                  onChange={(f) => set("outsideFormFields", f)}
                />
              </div>
            )}
          </>
        )}
      </Section>

      {error && (
        <p role="alert" className="rounded-input border border-error-red/40 px-12 py-8 text-body-sm text-error-red">
          {error}
        </p>
      )}

      <div className="flex gap-12">
        <Button type="submit" variant="filled" disabled={save.isPending || uploading}>
          {save.isPending ? "Saving…" : event ? "Save changes" : "Add event"}
        </Button>
        <Button type="button" variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-16 rounded-card border border-graphite bg-carbon-card p-24">
      <div>
        <h3 className="text-body font-semibold text-ghost-white">{title}</h3>
        {hint && <p className="mt-4 text-body-sm text-ash-gray">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-caption text-steel-gray">{hint}</p>}
    </div>
  );
}