import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-40 w-full rounded-input border bg-carbon-card px-12 py-8 text-body-sm text-ghost-white placeholder:text-ash-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-pulse disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-error-red" : "border-graphite",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
