import { orbitalTech } from "@/data/tech";
import { SectionHeader } from "@/components/common/SectionHeader";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";

export function FocusSection() {
  return (
    <section className="section-spacing">
      <div className="container-page flex flex-col gap-48">
        <SectionHeader
          eyebrow="What We Focus On"
          title="Technologies We Explore"
          animateOnScroll={false}
        />

        <div className="grid grid-cols-1 items-center gap-48 lg:grid-cols-2 lg:gap-56">
          <div className="flex flex-col gap-24">
            <p className="text-body-lg text-ash-gray">
              At NeoFolks our primary focus is learning in public and via collaboration. We
              encourage cross-disciplinary partnerships between diverse fields so that people
              from various domains get to learn and create something new.
            </p>
            <p className="text-body-lg text-ash-gray">
              Continuous learning and development is our mission. Through regular events and
              workshops, we ensure that our members stay updated with new technologies and the
              latest trends.
            </p>
          </div>

          <div>
            <RadialOrbitalTimeline
              timelineData={orbitalTech}
              className="mx-auto w-[85%] max-w-[476px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}