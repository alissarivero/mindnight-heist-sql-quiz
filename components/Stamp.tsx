"use client";

import { motion } from "motion/react";

type Tone = "red" | "green" | "amber";
const TONES: Record<Tone, string> = {
  red: "border-blood text-blood",
  green: "border-evidence text-evidence",
  amber: "border-amber text-amber",
};

/** Rubber-stamp slam animation. */
export function Stamp({ text, tone = "red", className = "", rotate = -12, animate = true }: {
  text: string; tone?: Tone; className?: string; rotate?: number; animate?: boolean;
}) {
  return (
    <motion.div
      initial={animate ? { scale: 2.6, opacity: 0, rotate: rotate - 8 } : false}
      animate={{ scale: 1, opacity: 0.92, rotate }}
      transition={{ type: "spring", stiffness: 420, damping: 18, mass: 0.8 }}
      className={`pointer-events-none select-none rounded-md border-[3px] px-3 py-1 font-display text-xl uppercase tracking-[0.2em] mix-blend-multiply ${TONES[tone]} ${className}`}
      style={{ boxShadow: "inset 0 0 0 2px currentColor" }}
    >
      {text}
    </motion.div>
  );
}
