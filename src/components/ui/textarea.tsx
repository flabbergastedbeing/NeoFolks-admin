import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full rounded-input border bg-carbon-card px-12 py-8 text-body-sm text-ghost-white placeholder:text-ash-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-pulse disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-error-red" : "border-graphite",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
