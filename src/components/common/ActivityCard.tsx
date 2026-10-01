import { cn } from "@/lib/utils";
import type { Activity } from "@/types";

interface ActivityCardProps {
  activity: Activity;
  className?: string;
}

// Same purple glow used by CtaBand ("Ready to build with us?"), so the cards
// and the closing band read as one visual language.
const CARD_GLOW =
  "radial-gradient(ellipse at 50% 0%, rgba(163,102,255,0.24), rgba(123,78,245,0.1) 45%, transparent 75%)";

export function ActivityCard({ activity, className }: ActivityCardProps) {
  const Icon = activity.icon;

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col justify-between overflow-hidden rounded-card border border-graphite bg-carbon-card p-24",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: CARD_GLOW }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between">
        <span className="text-body-sm text-steel-gray">{activity.number}</span>
        <span
          className="flex h-40 w-40 items-center justify-center rounded-full border border-graphite bg-white/5"
          aria-hidden="true"
        >
          <Icon className="h-20 w-20 text-ghost-white" strokeWidth={1.75} />
        </span>
      </div>

      <div className="relative">
        <p className="text-body font-semibold text-ghost-white">{activity.title}</p>
        <p className="mt-8 text-body-sm text-ash-gray">{activity.description}</p>
      </div>
    </div>
  );
}
