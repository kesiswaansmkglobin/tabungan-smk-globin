import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
  activeKey: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  duration: 0.2,
};

export const PageTransition = memo(({ children, activeKey }: PageTransitionProps) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={activeKey}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  </AnimatePresence>
));
PageTransition.displayName = "PageTransition";
