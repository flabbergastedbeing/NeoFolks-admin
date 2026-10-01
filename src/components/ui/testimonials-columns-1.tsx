import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Testimonial } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface TestimonialsColumnProps {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}

// Uses the same plain-CSS marquee approach as FocusSection's tech ticker
// (animate-marquee-vertical, defined in tailwind.config.ts) rather than
// framer-motion's `animate` prop — this keeps it unaffected by the app's
// <MotionConfig reducedMotion="user"> and instead falls back to a static,
// non-looping list when the OS "reduce motion" setting is on, matching
// FocusSection's own accessibility handling.
export const TestimonialsColumn = ({ className, testimonials, duration = 20 }: TestimonialsColumnProps) => {
  const reducedMotion = useReducedMotion();
  const items = reducedMotion ? testimonials : [...testimonials, ...testimonials];

  return (
    <div className={className}>
      <div
        className={
          reducedMotion
            ? "flex flex-col gap-16 pb-16"
            : "flex flex-col gap-16 pb-16 animate-marquee-vertical will-change-transform group-hover:[animation-play-state:paused]"
        }
        style={reducedMotion ? undefined : { animationDuration: `${duration}s` }}
      >
        {items.map(({ id, name, role, quote }, i) => (
          <div
            key={`${i}-${id}`}
            className="w-full max-w-xs rounded-card border border-graphite bg-carbon-card p-24"
          >
            <blockquote className="font-iowan-old-style text-body-sm font-light leading-[1.5] tracking-[-0.42px] text-ash-gray">
              "{quote}"
            </blockquote>
            <div className="mt-20 flex items-center gap-12">
              <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full border border-graphite bg-void-black text-caption font-medium text-ghost-white">
                {initials(name)}
              </div>
              <div className="flex flex-col">
                <div className="text-body-sm font-medium leading-5 tracking-[-0.42px] text-ghost-white">
                  {name}
                </div>
                <div className="text-caption leading-5 text-ash-gray">{role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};