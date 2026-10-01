import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

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
import { backend, BackendError, type SubmitRegistrationResult } from "@/lib/backend";
import {
  buildRegistrationSchema,
  fieldKey,
  registrationDefaults,
} from "@/lib/formFields";
import { cn } from "@/lib/utils";
import type { ClubEvent, FormField, RegistrantType } from "@/types";

interface RegistrationFormProps {
  event: ClubEvent;
  onBack: () => void;
  onSubmitted: (result: SubmitRegistrationResult, email: string) => void;
}

// The registration form shown inside the event popup. Name and email are always
// asked; everything else comes from the fields the admin set up for the event.
export function RegistrationForm({ event, onBack, onSubmitted }: RegistrationFormProps) {
  const queryClient = useQueryClient();
  const nuvFields = useMemo(() => event.formFields ?? [], [event.formFields]);
  const outsideFields = useMemo(() => event.outsideFormFields ?? [], [event.outsideFormFields]);
  const outsideEnabled = Boolean(event.outsideFormEnabled);

  // NUV students and outsiders each have their own questions.
  const [registrantType, setRegistrantType] = useState<RegistrantType>("nuv");
  const activeType: RegistrantType = outsideEnabled ? registrantType : "nuv";
  const fields = activeType === "outside" ? outsideFields : nuvFields;
  const schema = useMemo(() => buildRegistrationSchema(fields), [fields]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string | boolean>>({
    resolver: zodResolver(schema),
    // Both forms' fields start empty, so switching back and forth keeps whatever was typed.
    defaultValues: {
      ...registrationDefaults(nuvFields),
      ...registrationDefaults(outsideFields),
    },
  });

  const switchType = (type: RegistrantType) => {
    if (type === registrantType) return;
    setRegistrantType(type);
    setServerError(null);
    clearErrors();
  };

  const errorOf = (name: string) => errors[name]?.message as string | undefined;

  const onSubmit = async (values: Record<string, string | boolean>) => {
    setServerError(null);
    const answers: Record<string, string | boolean> = {};
    for (const field of fields) answers[field.id] = values[fieldKey(field.id)];

    try {
      const result = await backend.submitRegistration({
        eventId: event.id,
        fullName: String(values.fullName),
        email: String(values.email),
        registrantType: activeType,
        answers,
      });
      // Refresh the "spots left" numbers everywhere.
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      onSubmitted(result, String(values.email).trim());
    } catch (error) {
      setServerError(
        error instanceof BackendError ? error.message : "Something went wrong. Please try again.",
      );
    }
  };

  const willBeWaitlisted =
    event.capacity != null && (event.taken ?? 0) >= event.capacity;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-20">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-8 text-body-sm text-ash-gray transition-colors duration-200 hover:text-ghost-white"
      >
        <ArrowLeft className="h-16 w-16" aria-hidden="true" />
        Back to details
      </button>

      <div>
        <h3 className="font-alpha-lyrae text-subheading font-normal text-ghost-white">
          Your details
        </h3>
        <p className="mt-4 text-body-sm text-ash-gray">
          {willBeWaitlisted
            ? "This event is full, but you can join the waitlist and we'll be in touch if a spot opens up."
            : "Fill in your details and we'll review your entry. You'll get an email once it's approved."}
        </p>
      </div>

      {outsideEnabled && (
        <div className="flex flex-col gap-8">
          <span className="text-body-sm text-ash-gray">I am registering as</span>
          <div
            role="radiogroup"
            aria-label="Registering as"
            className="grid grid-cols-2 gap-4 rounded-button border border-graphite p-4"
          >
            {(
              [
                { value: "nuv", label: "NUV Student" },
                { value: "outside", label: "Outside University" },
              ] as { value: RegistrantType; label: string }[]
            ).map((option) => {
              const selected = activeType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => switchType(option.value)}
                  className={cn(
                    "rounded-input px-12 py-8 text-body-sm font-medium transition-colors duration-200",
                    selected
                      ? "bg-ghost-white text-void-black"
                      : "text-ash-gray hover:text-ghost-white",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Field label="Full name" htmlFor="reg-name" error={errorOf("fullName")} required>
        <Input
          id="reg-name"
          autoComplete="name"
          invalid={Boolean(errorOf("fullName"))}
          aria-invalid={Boolean(errorOf("fullName"))}
          {...register("fullName")}
        />
      </Field>

      <Field label="Email" htmlFor="reg-email" error={errorOf("email")} required>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          invalid={Boolean(errorOf("email"))}
          aria-invalid={Boolean(errorOf("email"))}
          {...register("email")}
        />
      </Field>

      {fields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          error={errorOf(fieldKey(field.id))}
          register={register}
          control={control}
        />
      ))}

      {serverError && (
        <p role="alert" className="rounded-input border border-error-red/40 px-12 py-8 text-body-sm text-error-red">
          {serverError}
        </p>
      )}

      <Button type="submit" variant="filled" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Submitting…" : willBeWaitlisted ? "Join the waitlist" : "Submit registration"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-4 text-steel-gray">*</span>}
      </Label>
      {children}
      <p role="alert" aria-live="polite" className="min-h-[18px] text-caption text-error-red">
        {error}
      </p>
    </div>
  );
}

function DynamicField({
  field,
  error,
  register,
  control,
}: {
  field: FormField;
  error?: string;
  register: ReturnType<typeof useForm<Record<string, string | boolean>>>["register"];
  control: ReturnType<typeof useForm<Record<string, string | boolean>>>["control"];
}) {
  const name = fieldKey(field.id);
  const id = `reg-${field.id}`;
  const invalid = Boolean(error);

  if (field.type === "checkbox") {
    return (
      <div className="flex flex-col gap-8">
        <label htmlFor={id} className="flex cursor-pointer items-start gap-12 text-body-sm text-ghost-white">
          <input
            id={id}
            type="checkbox"
            className="mt-[3px] h-16 w-16 shrink-0 cursor-pointer accent-lavender-pulse"
            aria-invalid={invalid}
            {...register(name)}
          />
          <span>
            {field.label}
            {field.required && <span className="ml-4 text-steel-gray">*</span>}
          </span>
        </label>
        <p role="alert" aria-live="polite" className="min-h-[18px] text-caption text-error-red">
          {error}
        </p>
      </div>
    );
  }

  return (
    <Field label={field.label} htmlFor={id} error={error} required={field.required}>
      {field.type === "textarea" ? (
        <Textarea id={id} invalid={invalid} aria-invalid={invalid} {...register(name)} />
      ) : field.type === "select" ? (
        <Controller
          control={control}
          name={name}
          render={({ field: controlled }) => (
            <Select value={String(controlled.value ?? "")} onValueChange={controlled.onChange}>
              <SelectTrigger id={id} invalid={invalid} aria-invalid={invalid}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      ) : (
        <Input
          id={id}
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
          inputMode={field.type === "number" ? "decimal" : undefined}
          invalid={invalid}
          aria-invalid={invalid}
          {...register(name)}
        />
      )}
    </Field>
  );
}

// Shown in the popup once a registration has been submitted.
export function RegistrationSuccess({
  result,
  email,
}: {
  result: SubmitRegistrationResult;
  email: string;
}) {
  const waitlisted = result.status === "waitlisted";
  const Icon = waitlisted ? Clock : CheckCircle2;

  return (
    <div className="flex flex-col items-start gap-16" role="status">
      <Icon
        className={`h-40 w-40 ${waitlisted ? "text-lavender-pulse" : "text-mint-signal"}`}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h3 className="font-alpha-lyrae text-subheading font-normal text-ghost-white">
        {waitlisted ? "You're on the waitlist" : "You're registered"}
      </h3>
      <p className="text-body-sm text-ash-gray">
        {waitlisted ? (
          <>
            This event is full, so we've added you to the waitlist
            {result.waitlistPosition ? ` (position ${result.waitlistPosition})` : ""}. If a spot
            opens up and you're promoted, we'll email <span className="text-ghost-white">{email}</span>.
          </>
        ) : (
          <>
            Thanks! We'll review your entry and email{" "}
            <span className="text-ghost-white">{email}</span> once it's approved.
          </>
        )}
      </p>
      <DialogPrimitive.Close asChild>
        <Button variant="outlined">Close</Button>
      </DialogPrimitive.Close>
    </div>
  );
}