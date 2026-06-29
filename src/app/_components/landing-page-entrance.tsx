"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    filter: "blur(10px)",
    opacity: 0,
    scale: 0.985,
    y: 26,
  },
  visible: {
    filter: "none",
    opacity: 1,
    scale: 1,
    transition: {
      bounce: 0,
      duration: 0.55,
      type: "spring",
    },
    y: 0,
  },
};

export function LandingPageEntrance({
  children,
  className,
  dir = "rtl",
  itemClassName,
}: {
  children: ReactNode;
  className?: string;
  dir?: "ltr" | "rtl";
  itemClassName?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      animate="visible"
      className={className}
      dir={dir}
      initial={reduceMotion ? false : "hidden"}
      variants={containerVariants}
    >
      {Children.toArray(children).map((child, index) => (
        <motion.div
          className={itemClassName}
          key={index}
          variants={itemVariants}
        >
          {child}
        </motion.div>
      ))}
    </motion.section>
  );
}
