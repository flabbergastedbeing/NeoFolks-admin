import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { pageMeta } from "@/lib/seo";
import { SectionHeader } from "@/components/common/SectionHeader";
import { MissionSection } from "@/components/sections/MissionSection";
import { RootedInSection } from "@/components/sections/RootedInSection";
import { ScopeSection } from "@/components/sections/ScopeSection";
import { CoreValuesSection } from "@/components/sections/CoreValuesSection";
import { CtaBand } from "@/components/sections/CtaBand";

export default function About() {
  useDocumentMeta(pageMeta.about);

  return (
    <>
      <section className="pt-[120px] md:pt-[152px]">
        <div className="container-page">
          <SectionHeader
            eyebrow="Who We Are"
            title="About Neofolks"
            subhead="The premier technology club at Navrachana University, dedicated to fostering innovation, creativity, and collaboration among students passionate about technology."
          />
        </div>
      </section>
      <MissionSection />
      <RootedInSection />
      <ScopeSection />
      <CoreValuesSection />
      <CtaBand />
    </>
  );
}
