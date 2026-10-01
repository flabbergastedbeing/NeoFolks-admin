import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { pageMeta } from "@/lib/seo";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ContactChannels } from "@/components/sections/ContactChannels";
import { ContactForm } from "@/components/sections/ContactForm";

export default function Contact() {
  useDocumentMeta(pageMeta.contact);

  return (
    <section className="pt-[120px] pb-96 md:pt-[152px] md:pb-128">
      <div className="container-page flex flex-col gap-56">
        <SectionHeader
          eyebrow="Reach Out"
          title="Get In Touch"
          subhead="Have questions? Want to join or collaborate? We'd love to hear from you."
        />
        <div className="grid grid-cols-1 gap-24 md:grid-cols-2">
          <ContactChannels />
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
