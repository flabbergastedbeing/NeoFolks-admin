import { EASE_OUT, stagger } from "@/lib/motion";
import { motion } from "framer-motion";
import { missionCards } from "@/data/activities";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PillBadge } from "@/components/common/PillBadge";
import { AccentScene } from "@/components/three/AccentScene";

export function MissionSection() {
  return (
    <section className="section-spacing">
      <div className="container-page flex flex-col gap-48">
        <SectionHeader
          eyebrow="Our Mission & Vision"
          title="Education Beyond Books"
          subhead="Our mission is to bridge academic learning and real-world applications, emphasizing industry connection, practical learning, and interdisciplinary collaboration."
        />

        <AccentScene />

        <div className="grid grid-cols-1 gap-16 sm:grid-cols-3">
          {missionCards.map((card, i) => (
            <motion.div
              key={card.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: stagger(i, 0.06), ease: EASE_OUT }}
              className="rounded-card border border-graphite bg-carbon-card p-20 transition-colors hover:border-steel-gray"
            >
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-steel-gray">{card.number}</span>
                <PillBadge>{card.tag}</PillBadge>
              </div>
              <p className="mt-12 text-body font-semibold text-ghost-white">{card.title}</p>
              <p className="mt-8 text-body-sm text-ash-gray">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
