import { SectionHeader } from "@/components/common/SectionHeader";
import { ModernActivitiesGrid } from "@/components/sections/ModernActivitiesGrid";

export function ActivitiesSection() {
  return (
    <section className="section-spacing relative overflow-hidden">
      <div className="container-page flex flex-col gap-48">
        <SectionHeader
          eyebrow="What We Do"
          title="Designed for Builders"
          subhead="From beginner workshops to high-stakes hackathons, everything we do is crafted to help you ship real software."
          animateOnScroll={false}
        />

        <ModernActivitiesGrid />
      </div>
    </section>
  );
}