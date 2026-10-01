import { cn } from "@/lib/utils";

interface PillBadgeProps {
  children: React.ReactNode;
  tone?: "default" | "mint";
  live?: boolean;
  className?: string;
}

// Design.md "Pill Badge" component. Mint is used only for genuinely live /
// status content, per the color usage rules.
export function PillBadge({ children, tone = "default", live, className }: PillBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-8 rounded-badge border px-12 py-4 text-caption font-medium",
        tone === "mint"
          ? "border-mint-signal/50 text-mint-signal"
          : "border-steel-gray text-ash-gray",
        className
      )}
    >
      {live && (
        <span className="relative flex h-8 w-8">
          <span className="absolute inline-flex h-full w-full animate-glow-pulse rounded-full bg-mint-signal opacity-75" />
          <span className="relative inline-flex h-8 w-8 rounded-full bg-mint-signal" />
        </span>
      )}
      {children}
    </span>
  );
}
