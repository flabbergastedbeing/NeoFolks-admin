import { useMutation } from "@tanstack/react-query";
import { backend } from "@/lib/backend";
import type { ContactFormValues } from "@/lib/schemas";

export function useContactMutation() {
  return useMutation({
    mutationFn: (values: ContactFormValues) => backend.submitContactMessage(values),
  });
}