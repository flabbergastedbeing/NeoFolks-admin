import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  subject: z.enum(["join", "collaborate", "general"], {
    required_error: "Select a subject.",
  }),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(1000, "Message must be 1000 characters or fewer."),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const subjectOptions: { value: ContactFormValues["subject"]; label: string }[] = [
  { value: "join", label: "Join the club" },
  { value: "collaborate", label: "Collaborate" },
  { value: "general", label: "General question" },
];
