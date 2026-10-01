import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { pageMeta } from "@/lib/seo";
import { SectionHeader } from "@/components/common/SectionHeader";
import { TeamSection } from "@/components/sections/TeamSection";
import { CtaBand } from "@/components/sections/CtaBand";

export default function Teams() {
  useDocumentMeta(pageMeta.teams);

  return (
    <>
      <section className="pt-[120px] md:pt-[152px]">
        <div className="container-page">
          <SectionHeader
            eyebrow="The People"
            title="Our Team"
            subhead="Meet the passionate leaders driving innovation and fostering community growth at NeoFolks."
          />
        </div>
      </section>
      <TeamSection />
      <CtaBand
        title="Want to lead with us?"
        subhead="NeoFolks is run by students, for students. New leads join every year."
        buttonLabel="Get in touch"
      />
    </>
  );
}