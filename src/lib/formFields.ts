import { z } from "zod";
import type { FormField, FormFieldType } from "@/types";

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  email: "Email",
  phone: "Phone number",
  number: "Number",
  select: "Dropdown",
  checkbox: "Checkbox",
};

export const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as FormFieldType[];

// Ids are generated, never typed by the admin, so they stay stable when a label
// is renamed and are always safe to use as object keys / form names.
export function newFieldId(): string {
  return "f" + Math.random().toString(36).slice(2, 8);
}

export function newField(type: FormFieldType = "text"): FormField {
  return {
    id: newFieldId(),
    label: "",
    type,
    required: false,
    ...(type === "select" ? { options: [""] } : {}),
  };
}

// A sensible starting form for a new upcoming event.
export function defaultFormFields(): FormField[] {
  return [
    { id: newFieldId(), label: "Department", type: "text", required: true },
    {
      id: newFieldId(),
      label: "Year of study",
      type: "select",
      required: true,
      options: ["1st year", "2nd year", "3rd year", "4th year"],
    },
  ];
}

// A starting form for people from outside the university (editable by the admin).
export function defaultOutsideFormFields(): FormField[] {
  return [{ id: newFieldId(), label: "College / Organisation", type: "text", required: true }];
}

// The input name used in the registration form for a field.
export const fieldKey = (id: string) => `f_${id}`;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^[+0-9 ()-]{6,20}$/;
const NUMBER_RE = /^-?[0-9]+(\.[0-9]+)?$/;

// Same rules as the database function, so people get instant feedback and the
// server stays the final judge.
export function validateValue(field: FormField, value: string): string | null {
  const v = value.trim();
  if (v === "") return field.required ? `${field.label} is required.` : null;
  if (v.length > 2000) return `${field.label} is too long.`;
  if (field.type === "email" && !EMAIL_RE.test(v)) return `Enter a valid email for ${field.label}.`;
  if (field.type === "phone" && !PHONE_RE.test(v)) return `Enter a valid phone number for ${field.label}.`;
  if (field.type === "number" && !NUMBER_RE.test(v)) return `${field.label} must be a number.`;
  if (field.type === "select" && !(field.options ?? []).includes(v)) return `Choose an option for ${field.label}.`;
  return null;
}

export function buildRegistrationSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {
    fullName: z.string().trim().min(1, "Please enter your name.").max(200, "That name is too long."),
    email: z
      .string()
      .trim()
      .min(1, "Please enter your email.")
      .max(254)
      .regex(EMAIL_RE, "Please enter a valid email address."),
  };

  for (const field of fields) {
    if (field.type === "checkbox") {
      shape[fieldKey(field.id)] = field.required
        ? z.boolean().refine((v) => v, `${field.label} must be ticked.`)
        : z.boolean();
    } else {
      shape[fieldKey(field.id)] = z.string().superRefine((value, ctx) => {
        const message = validateValue(field, value);
        if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      });
    }
  }
  return z.object(shape);
}

export function registrationDefaults(fields: FormField[]): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = { fullName: "", email: "" };
  for (const field of fields) values[fieldKey(field.id)] = field.type === "checkbox" ? false : "";
  return values;
}

// Check the admin's form before saving it.
export function validateFormFields(fields: FormField[]): string | null {
  for (const [i, field] of fields.entries()) {
    const name = field.label.trim() || `Field ${i + 1}`;
    if (!field.label.trim()) return `${name} needs a label.`;
    if (field.type === "select") {
      const options = (field.options ?? []).map((o) => o.trim()).filter(Boolean);
      if (options.length === 0) return `"${name}" is a dropdown, so it needs at least one option.`;
      if (new Set(options).size !== options.length) return `"${name}" has the same option twice.`;
    }
  }
  return null;
}