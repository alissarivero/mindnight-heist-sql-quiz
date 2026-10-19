"use client";

import { motion } from "motion/react";

export function ScoreRing({ score, total, size = 72 }: { score: number; total: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? score / total : 0;
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${score} of ${total} points`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#2e2a22" strokeWidth={6} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6} strokeLinecap="round"
          stroke={pct === 1 ? "#4f9d69" : "#e3a63b"}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div>
          <div className="font-display text-xl">{score}</div>
          <div className="text-[10px] text-fog">/ {total}</div>
        </div>
      </div>
    </div>
  );
}
