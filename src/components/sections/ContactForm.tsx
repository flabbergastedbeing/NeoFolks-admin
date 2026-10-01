import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactFormSchema, subjectOptions, type ContactFormValues } from "@/lib/schemas";
import { useContactMutation } from "@/hooks/useContactMutation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function ContactForm() {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const mutation = useContactMutation();
  const messageValue = watch("message") ?? "";

  const onSubmit = async (values: ContactFormValues) => {
    try {
      await mutation.mutateAsync(values);
      toast.success("Message sent", {
        description: "Thanks for reaching out — we'll get back to you soon.",
      });
      reset();
    } catch (err) {
      toast.error("Something went wrong", {
        description:
          err instanceof Error ? err.message : "Your message couldn't be sent. Please try again.",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-24 rounded-card border border-graphite bg-carbon-card p-24"
    >
      <div className="flex flex-col gap-8">
        <Label htmlFor="name">Name</Label>
        <Input id="name" invalid={Boolean(errors.name)} aria-invalid={Boolean(errors.name)} aria-describedby="name-error" {...register("name")} />
        <p id="name-error" role="alert" aria-live="polite" className="text-caption text-error-red">
          {errors.name?.message}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" invalid={Boolean(errors.email)} aria-invalid={Boolean(errors.email)} aria-describedby="email-error" {...register("email")} />
        <p id="email-error" role="alert" aria-live="polite" className="text-caption text-error-red">
          {errors.email?.message}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <Label htmlFor="subject">Subject</Label>
        <Controller
          control={control}
          name="subject"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="subject" invalid={Boolean(errors.subject)} aria-invalid={Boolean(errors.subject)}>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p role="alert" aria-live="polite" className="text-caption text-error-red">
          {errors.subject?.message}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Label htmlFor="message">Message</Label>
          <span className="text-caption text-steel-gray">{messageValue.length}/1000</span>
        </div>
        <Textarea id="message" invalid={Boolean(errors.message)} aria-invalid={Boolean(errors.message)} aria-describedby="message-error" {...register("message")} />
        <p id="message-error" role="alert" aria-live="polite" className="text-caption text-error-red">
          {errors.message?.message}
        </p>
      </div>

      <Button type="submit" variant="filled" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
