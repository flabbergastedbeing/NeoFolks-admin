import { EASE_OUT } from "@/lib/motion";
import { motion } from "framer-motion";
import { scopeTags } from "@/data/activities";
import { SectionHeader } from "@/components/common/SectionHeader";

export function ScopeSection() {
  return (
    <section className="section-spacing">
      <div className="container-page flex flex-col gap-48">
        <SectionHeader eyebrow="Our Scope" title="What We Focus On" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="flex flex-wrap justify-center gap-12"
        >
          {scopeTags.map((tag) => (
            <span
              key={tag}
              className="rounded-badge border border-steel-gray px-16 py-8 text-body-sm text-ash-gray transition-colors hover:border-lavender-pulse hover:text-ghost-white"
            >
              {tag}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
