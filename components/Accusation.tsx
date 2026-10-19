"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { Stamp } from "@/components/Stamp";
import type { Suspect } from "@/lib/db";

type Lineup = Suspect & { clearedBy: string | null };

export function Accusation({ suspects, culprit, minutes, score, detective }: {
  suspects: Lineup[]; culprit: string; minutes: string; score: number; detective: string;
}) {
  const [phase, setPhase] = useState<"lineup" | "reveal">("lineup");
  const thief = suspects.find((s) => s.name === culprit)!;
  const cleared = suspects.filter((s) => s.clearedBy);

  useEffect(() => {
    if (phase !== "reveal") return;
    const end = Date.now() + 1600;
    const colors = ["#e3a63b", "#b8322a", "#ebe2cc"];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [phase]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-center text-xs uppercase tracking-[0.35em] text-amber">Case #0314 · Final report</p>
      <h1 className="mt-2 text-center font-display text-4xl sm:text-5xl">
        {phase === "lineup" ? "Narrowing the lineup" : "Case closed"}
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {suspects.map((s, i) => {
          const isThief = s.name === culprit;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-sm p-2 pb-3 shadow-xl ${isThief && phase === "reveal" ? "bg-amber text-ink ring-4 ring-amber/40" : "bg-[#f3eee2] text-[#2a241a]"}`}
            >
              <div className="relative grid aspect-square place-items-center overflow-hidden rounded-sm bg-gradient-to-b from-[#3a352c] to-[#1b1915] text-5xl">
                {s.photo_emoji}
                {s.clearedBy && (
                  <motion.svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                    <motion.path d="M10 10 L90 90 M90 10 L10 90" stroke="#b8322a" strokeWidth={7} strokeLinecap="round" fill="none"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6 + cleared.indexOf(s) * 0.18, duration: 0.35 }} />
                  </motion.svg>
                )}
              </div>
              <div className="mt-2 font-display text-sm leading-tight">{s.name}</div>
              <div className={`text-[11px] ${s.clearedBy ? "text-black/50" : "font-semibold text-blood"}`}>{s.clearedBy ?? "Unaccounted for"}</div>
            </motion.div>
          );
        })}
      </div>

      {phase === "lineup" ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + cleared.length * 0.18 }} className="mt-10 text-center">
          <p className="text-fog">{cleared.length} suspects are cleared by the evidence. One remains.</p>
          <button className="btn-amber mt-4 px-6 py-3 text-base" onClick={() => setPhase("reveal")}>Name the thief</button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          className="paper relative mx-auto mt-10 max-w-2xl rounded-lg p-8"
          style={{ transformPerspective: 1200 }}
        >
          <div className="flex items-start gap-6">
            <div className="grid h-32 w-28 shrink-0 place-items-center rounded-sm bg-gradient-to-b from-[#3a352c] to-[#1b1915] text-6xl shadow-inner">{thief.photo_emoji}</div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-black/50">Arrest warrant</div>
              <h2 className="font-display text-4xl text-[#1d1912]">{thief.name}</h2>
              <div className="text-sm text-black/60">{thief.role}</div>
              <p className="mt-3 text-[15px] leading-relaxed text-[#2a241a]">
                Swiped into the building at 22:50 through the Loading Dock. His alibi was contradicted by the intern. Gallery B&apos;s camera
                caught him at 00:41, six minutes before the Azure Heron vanished, and he then spent <strong>{minutes} minutes</strong> in the Vault Corridor
                before leaving through the dock at 01:12. Motive: <em>{thief.motive.toLowerCase()}</em>.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-black/15 pt-4 text-sm text-black/60">
            <span>Lead detective: <strong className="text-black/80">{detective}</strong></span>
            <span>Score: <strong className="text-black/80">{score} / {score}</strong></span>
          </div>
          <Stamp text="Case closed" tone="red" className="absolute -right-4 -top-5 bg-paper/0 text-3xl" rotate={12} />
        </motion.div>
      )}

      {phase === "reveal" && (
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/case" className="btn-ghost">Back to the board</Link>
          <Link href="/case-log" className="btn-ghost">Review the case log</Link>
        </div>
      )}
    </div>
  );
}
