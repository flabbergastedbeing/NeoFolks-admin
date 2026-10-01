import { EASE_OUT } from "@/lib/motion";
import { motion } from "framer-motion";
import { PillBadge } from "@/components/common/PillBadge";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subhead?: string;
  // Fade/slide the header in as it scrolls into view. Defaults to on; the home
  // page turns it off so scrolling there stays perfectly plain.
  animateOnScroll?: boolean;
}

const scrollReveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: EASE_OUT },
};

// Design.md "Section Header" component: centered eyebrow pill, serif h2,
// Inter subhead, max-width ~640px.
export function SectionHeader({
  eyebrow,
  title,
  subhead,
  animateOnScroll = true,
}: SectionHeaderProps) {
  return (
    <motion.div
      {...(animateOnScroll ? scrollReveal : {})}
      className="mx-auto flex max-w-[640px] flex-col items-center gap-24 text-center"
    >
      {eyebrow && <PillBadge>{eyebrow}</PillBadge>}
      <h2 className="text-display-heading">{title}</h2>
      {subhead && <p className="text-body-lg text-ash-gray">{subhead}</p>}
    </motion.div>
  );
}
