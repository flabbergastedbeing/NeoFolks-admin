import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { pageMeta } from "@/lib/seo";
import { SectionHeader } from "@/components/common/SectionHeader";
import { EventTypesSection } from "@/components/sections/EventTypesSection";
import { EventTimeline } from "@/components/sections/EventTimeline";
import { CtaBand } from "@/components/sections/CtaBand";

export default function Events() {
  useDocumentMeta(pageMeta.events);

  return (
    <>
      <section className="pt-[120px] md:pt-[152px]">
        <div className="container-page">
          <SectionHeader
            eyebrow="What's Happening"
            title="Events & Activities"
            subhead="Join us for exciting workshops, seminars, hackathons, and community events."
          />
        </div>
      </section>
      <EventTypesSection />
      <EventTimeline />
      <CtaBand title="Don't miss the next one" subhead="Join NeoFolks to get updates on upcoming events." buttonLabel="Join NeoFolks" />
    </>
  );
}
