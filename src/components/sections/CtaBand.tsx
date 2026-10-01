import { EASE_OUT } from "@/lib/motion";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface CtaBandProps {
  title?: string;
  subhead?: string;
  buttonLabel?: string;
  to?: string;
  animateOnScroll?: boolean;
}

const scrollReveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: EASE_OUT },
};

export function CtaBand({
  title = "Ready to build with us?",
  subhead = "Join a community of students learning and shipping projects together.",
  buttonLabel = "Get in touch",
  to = "/contact",
  animateOnScroll = true,
}: CtaBandProps) {
  return (
    <section className="section-spacing">
      <motion.div
        {...(animateOnScroll ? scrollReveal : {})}
        className="container-page relative flex flex-col items-center gap-24 overflow-hidden rounded-card border border-graphite py-56 text-center"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(163,102,255,0.24), rgba(123,78,245,0.1) 45%, transparent 75%)",
          }}
          aria-hidden="true"
        />
        <h2 className="text-display-heading relative">{title}</h2>
        <p className="relative max-w-[480px] text-body-lg text-ash-gray">{subhead}</p>
        <Button asChild variant="filled" className="relative">
          <Link to={to}>{buttonLabel}</Link>
        </Button>
      </motion.div>
    </section>
  );
}
