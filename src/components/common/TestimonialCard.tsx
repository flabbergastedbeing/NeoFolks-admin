import { EASE_OUT } from "@/lib/motion";
import { motion } from "framer-motion";
import type { Testimonial } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Design.md "Testimonial Card": no card chrome, 64px avatar, Iowan Old Style
// substitute quote at 24px/300. "Read case study" link is intentionally
// omitted per the build brief.
export function TestimonialCard({ name, role, quote }: Testimonial) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="flex flex-col gap-20 sm:flex-row"
    >
      <div className="flex h-64 w-64 shrink-0 items-center justify-center rounded-full border border-graphite bg-carbon-card text-body-sm font-medium text-ghost-white">
        {initials(name)}
      </div>
      <div>
        <blockquote className="font-iowan-old-style text-subheading font-light leading-[1.25] tracking-[-0.025em] text-ghost-white">
          "{quote}"
        </blockquote>
        <figcaption className="mt-16">
          <p className="text-body-sm font-medium text-ghost-white">{name}</p>
          <p className="text-caption text-ash-gray">{role}</p>
        </figcaption>
      </div>
    </motion.figure>
  );
}
