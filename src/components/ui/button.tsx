import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Button variants implement Design.md's "Filled Primary Button", "Ghost Text
// Button" and "Outlined Action Button" — never a violet/mint fill (see the
// design doc's Do's and Don'ts).
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-button text-body-sm font-medium transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-pulse disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        filled: "bg-ghost-white text-void-black hover:bg-bone-white px-20 py-12",
        ghost: "bg-transparent text-ghost-white hover:underline underline-offset-4 px-2 py-12",
        // py-[10px]: the site's spacing scale has no "10" key, so `py-10` fell back
        // to Tailwind's default 2.5rem (40px) and made this variant ~106px tall.
        outlined:
          "bg-transparent text-ghost-white border border-steel-gray hover:border-ghost-white px-20 py-[10px]",
      },
      size: {
        default: "",
        // Spelled out as arbitrary values (same as the `caption` token) because
        // tailwind-merge treats the custom `text-caption` class as a text colour
        // and would drop the variant's text colour (white text on a white button).
        sm: "text-[12px] leading-[1.5] tracking-[-0.36px] px-16 py-8",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
