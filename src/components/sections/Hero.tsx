import { EASE_OUT } from "@/lib/motion";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PillBadge } from "@/components/common/PillBadge";

export function Hero() {
  return (
    <section className="relative min-h-[640px] pt-[220px] md:min-h-[1000px] md:pt-[240px]">
      <div className="container-page flex flex-col items-center gap-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <PillBadge>Navrachana University Tech Club</PillBadge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT }}
          className="text-display-heading max-w-[720px]"
        >
          Learn in public. Build together.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
          className="max-w-[640px] text-body-lg text-ash-gray"
        >
          NeoFolks is the technology club at Navrachana University, Vadodara, where students
          build, learn, and grow together through workshops, events, and shared projects.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT }}
          className="flex flex-col items-center gap-16 sm:flex-row"
        >
          <Button asChild variant="filled">
            <Link to="/contact">Join NeoFolks</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/events">See our events</Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-caption text-ash-gray"
        >
          Open to every student at Navrachana University — no experience required.
        </motion.p>
      </div>
    </section>
  );
}