import { motion } from "framer-motion";
import { DURATION, EASE_IN, EASE_OUT } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

// Page-level transition, driven by AnimatePresence in App.tsx. The outgoing
// page leaves quickly (so navigation feels instant) and the incoming page
// settles in with a small upward drift and a long, soft ease.
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } }}
      exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE_IN } }}
    >
      {children}
    </motion.div>
  );
}
