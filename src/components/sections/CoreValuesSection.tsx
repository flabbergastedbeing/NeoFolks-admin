import { EASE_OUT, stagger } from "@/lib/motion";
import { motion } from "framer-motion";
import { coreValues } from "@/data/activities";
import { SectionHeader } from "@/components/common/SectionHeader";

export function CoreValuesSection() {
  return (
    <section className="section-spacing">
      <div className="container-page flex flex-col gap-48">
        <SectionHeader eyebrow="What Drives Us" title="Our Core Values" />
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-4">
          {coreValues.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: stagger(i, 0.05), ease: EASE_OUT }}
              className="rounded-card border border-graphite bg-carbon-card p-20 transition-colors hover:border-steel-gray"
            >
              <p className="text-body font-semibold text-ghost-white">{value.title}</p>
              <p className="mt-8 text-body-sm text-ash-gray">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
