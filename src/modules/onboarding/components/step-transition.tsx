"use client";

import { motion, useReducedMotion } from "motion/react";

/** A short fade and lift between setup steps, skipped for people who prefer less motion. */
export function StepTransition({
  stepKey,
  children,
}: {
  stepKey: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={stepKey}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
