import { EASE_OUT } from "@/lib/motion";
import { motion } from "framer-motion";
import { Linkedin, Github } from "lucide-react";
import type { TeamMember } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Design.md "Carbon Card" for team members: 64px avatar, name, role, and
// small social icons that brighten steel-gray -> white on hover.
export function TeamCard({ name, role, linkedin, github }: TeamMember) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="rounded-card border border-graphite bg-carbon-card p-20 text-center transition-colors hover:border-steel-gray"
    >
      <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full border border-graphite bg-void-black text-body-sm font-medium text-ghost-white">
        {initials(name)}
      </div>
      <p className="mt-16 text-body font-semibold text-ghost-white">{name}</p>
      <p className="text-body-sm text-ash-gray">{role}</p>
      <div className="mt-16 flex items-center justify-center gap-16">
        {linkedin && (
          <a
            href={linkedin}
            aria-label={`${name} on LinkedIn`}
            className="text-steel-gray transition-colors hover:text-ghost-white"
          >
            <Linkedin className="h-16 w-16" />
          </a>
        )}
        {github && (
          <a
            href={github}
            aria-label={`${name} on GitHub`}
            className="text-steel-gray transition-colors hover:text-ghost-white"
          >
            <Github className="h-16 w-16" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
