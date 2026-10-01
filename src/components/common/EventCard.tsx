import { EASE_OUT } from "@/lib/motion";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ClubEvent } from "@/types";
import { PillBadge } from "@/components/common/PillBadge";

// Timeline card for the Events page — upcoming events get a mint glow pill,
// past events get a steel-gray pill, per section 6.4 of the build brief.
// `focused` comes from the serpentine timeline: only the focused card opens the
// popup, so only it shows the "View details" hint.
export function EventCard({
  title,
  date,
  category,
  description,
  status,
  focused = false,
}: ClubEvent & { focused?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="group rounded-card border border-graphite bg-carbon-card p-20 transition-colors hover:border-steel-gray"
    >
      <div className="flex flex-wrap items-center justify-between gap-8">
        {status === "upcoming" ? (
          <PillBadge tone="mint" live>
            Upcoming
          </PillBadge>
        ) : (
          <PillBadge>Past</PillBadge>
        )}
        <span className="text-caption text-steel-gray">{category}</span>
      </div>
      <p className="mt-12 text-body font-semibold text-ghost-white">{title}</p>
      <p className="text-body-sm text-ash-gray">{date}</p>
      <p className="mt-8 text-body-sm text-ash-gray">{description}</p>
      <span
        aria-hidden={!focused}
        className={`mt-16 inline-flex items-center gap-4 text-caption font-medium text-steel-gray transition-[color,opacity] duration-300 group-hover:text-ghost-white ${
          focused ? "opacity-100" : "opacity-0"
        }`}
      >
        View details
        <ArrowRight
          className="h-12 w-12 transition-transform duration-200 group-hover:translate-x-4"
          aria-hidden="true"
        />
      </span>
    </motion.div>
  );
}
