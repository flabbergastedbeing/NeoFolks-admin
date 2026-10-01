import { EASE_OUT, stagger } from "@/lib/motion";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/common/SectionHeader";

const items = [
  {
    title: "Education Beyond Books",
    description:
      "Embracing NUV's philosophy of holistic development through hands-on workshops, tech talks, and projects that prepare students for real-world challenges.",
  },
  {
    title: "Innovation & Industry Focus",
    description:
      "Aligned with NUV's commitment to industry connection, we facilitate interdisciplinary collaboration and engagement with emerging technologies.",
  },
];

export function RootedInSection() {
  return (
    <section className="section-spacing">
      <div className="container-page flex flex-col gap-48">
        <SectionHeader title="Our Connection to NUV" />
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: stagger(i, 0.06), ease: EASE_OUT }}
              className="rounded-card border border-graphite bg-carbon-card p-20 transition-colors hover:border-steel-gray"
            >
              <p className="text-body font-semibold text-ghost-white">{item.title}</p>
              <p className="mt-8 text-body-sm text-ash-gray">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
