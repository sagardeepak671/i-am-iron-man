"use client";

import { motion, type Variants } from "framer-motion";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";
import type { ReactNode } from "react";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

type SectionProps = { children: ReactNode; className?: string };

/**
 * Staggered reveal on scroll. With `prefers-reduced-motion: reduce` both
 * wrappers render plain, fully visible elements (no transforms, no delay).
 * The preference hook is hydration-safe (server value false), so the switch
 * to plain elements happens in a post-hydration render and replaces the
 * motion element entirely — no stranded inline `opacity: 0`.
 */
export function AnimatedSection({ children, className = "" }: SectionProps) {
  const reduce = useReducedMotionPreference();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({ children, className = "" }: SectionProps) {
  const reduce = useReducedMotionPreference();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
