"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CheckCircle2, CircleDashed, Lock, PenLine, Search, UserX } from "lucide-react";
import type { Progress } from "@/lib/db";
import type { Question } from "@/lib/questions";
import { ScoreRing } from "@/components/ScoreRing";
import { Stamp } from "@/components/Stamp";
import { Prose } from "@/components/Prose";

/** Desktop pin positions (percent of board). Index 5 is the accusation card. */
const SPOTS = [
  { left: 3, top: 5, rot: -3 },
  { left: 38, top: 2, rot: 2 },
  { left: 73, top: 7, rot: -1.5 },
  { left: 10, top: 53, rot: 2.5 },
  { left: 44, top: 56, rot: -2 },
  { left: 76, top: 52, rot: 3 },
];
const CARD_W = 22;
const center = (i: number) => ({ x: SPOTS[i].left + CARD_W / 2, y: SPOTS[i].top + 17 });

type Props = { questions: Question[]; progress: Progress; total: number; signedIn: boolean };

export function EvidenceBoard({ questions, progress, total, signedIn }: Props) {
  const solved = questions.filter((q) => progress[q.id]?.solved);
  const score = solved.reduce((s, q) => s + q.points, 0);
  const allSolved = solved.length === questions.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber">Case #0314</p>
          <h1 className="font-display text-4xl">Evidence Board</h1>
          <p className="mt-1 text-sm text-fog">
            Open a case file, query the evidence, and submit your answer. Solved clues are connected with red string.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right text-sm">
            <div className="text-fog">Clues solved</div>
            <div className="font-display text-2xl">{solved.length} / {questions.length}</div>
          </div>
          <ScoreRing score={score} total={total} />
        </div>
      </div>

      {!signedIn && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-sm">
          <Lock size={16} className="shrink-0 text-amber" />
          <span>You can read the case files, but you need to <Link href="/login?next=/case" className="font-semibold text-amber underline">sign in</Link> to run queries and save answers.</span>
        </div>
      )}

      {/* Desktop corkboard */}
      <div className="cork relative hidden aspect-[16/9] min-h-[620px] overflow-hidden rounded-xl lg:block">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {SPOTS.slice(0, -1).map((_, i) => {
            const a = center(i);
            const b = center(i + 1);
            const done = i < questions.length - 1
              ? progress[questions[i].id]?.solved && progress[questions[i + 1].id]?.solved
              : progress[questions[i].id]?.solved && allSolved;
            const mid = { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + 8 };
            return (
              <motion.path
                key={i}
                d={`M ${a.x} ${a.y} Q ${mid.x} ${mid.y} ${b.x} ${b.y}`}
                fill="none"
                stroke={done ? "#c0392b" : "rgba(255,255,255,0.18)"}
                strokeWidth={done ? 3 : 1.5}
                strokeDasharray={done ? undefined : "6 6"}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.25, ease: "easeInOut" }}
                style={done ? { filter: "drop-shadow(0 2px 2px rgba(0,0,0,.6))" } : undefined}
              />
            );
          })}
        </svg>

        {questions.map((q, i) => (
          <div key={q.id} className="absolute" style={{ left: `${SPOTS[i].left}%`, top: `${SPOTS[i].top}%`, width: `${CARD_W}%` }}>
            <CaseCard q={q} index={i} rot={SPOTS[i].rot} progress={progress} />
          </div>
        ))}
        <div className="absolute" style={{ left: `${SPOTS[5].left}%`, top: `${SPOTS[5].top}%`, width: `${CARD_W}%` }}>
          <AccuseCard unlocked={allSolved} rot={SPOTS[5].rot} />
        </div>
      </div>

      {/* Mobile stack */}
      <div className="grid gap-5 sm:grid-cols-2 lg:hidden">
        {questions.map((q, i) => (
          <CaseCard key={q.id} q={q} index={i} rot={0} progress={progress} />
        ))}
        <AccuseCard unlocked={allSolved} rot={0} />
      </div>
    </div>
  );
}

function Pin({ color = "#c0392b" }: { color?: string }) {
  return (
    <span
      className="absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full"
      style={{ background: `radial-gradient(circle at 35% 35%, #fff8 0 15%, ${color} 40%, #0008 100%)`, boxShadow: "0 3px 4px rgba(0,0,0,.5)" }}
    />
  );
}

function CaseCard({ q, index, rot, progress }: { q: Question; index: number; rot: number; progress: Progress }) {
  const p = progress[q.id];
  const status = p?.solved ? "solved" : p ? "attempted" : "new";
  return (
    <motion.div
      initial={{ opacity: 0, y: -30, rotate: rot - 6 }}
      animate={{ opacity: 1, y: 0, rotate: rot }}
      whileHover={{ y: -6, rotate: 0, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 200, damping: 16, delay: index * 0.08 }}
      className="relative"
    >
      <Pin />
      <Link href={`/case/${q.id}`} className="paper group block rounded-sm p-4 outline-none">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-black/55">
          <span>{q.code}</span>
          <span>{q.points} pts</span>
        </div>
        <h3 className="mt-2 font-display text-xl leading-tight text-[#1d1912]">{q.title}</h3>
        <div className="mt-2 flex flex-wrap gap-1">
          {q.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-sm bg-black/8 px-1.5 py-0.5 font-mono text-[10px] text-black/60">{s}</span>
          ))}
        </div>
        <p className="mt-3 line-clamp-3 text-[12px] leading-snug text-black/70">
          <Prose text={status === "solved" ? q.solvedNote : q.prompt[0]} />
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
          {status === "solved" && <><CheckCircle2 size={14} className="text-evidence" /> <span className="text-evidence">Solved</span></>}
          {status === "attempted" && <><PenLine size={14} className="text-amber" /> <span className="text-[#9a6a12]">{p!.attempts} attempt{p!.attempts > 1 ? "s" : ""}</span></>}
          {status === "new" && <><CircleDashed size={14} className="text-black/40" /> <span className="text-black/50">Unopened</span></>}
          <span className="ml-auto flex items-center gap-1 text-black/50 transition group-hover:text-black"><Search size={12} /> Investigate</span>
        </div>
        {status === "solved" && <Stamp text="Solved" tone="green" className="absolute right-2 top-9 text-sm" rotate={-10} />}
      </Link>
    </motion.div>
  );
}

function AccuseCard({ unlocked, rot }: { unlocked: boolean; rot: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0, rotate: rot }}
      whileHover={unlocked ? { y: -6, rotate: 0, scale: 1.03 } : undefined}
      transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.5 }}
      className="relative"
    >
      <Pin color="#e3a63b" />
      <Link
        href="/case/accuse"
        aria-disabled={!unlocked}
        className={`block rounded-sm border-2 border-dashed p-4 ${unlocked ? "border-amber bg-ink-2/90" : "pointer-events-none border-white/20 bg-black/40"}`}
      >
        <div className="font-mono text-[10px] uppercase tracking-widest text-fog">Final report</div>
        <div className="my-3 grid aspect-[4/3] place-items-center rounded-sm bg-black/50">
          {unlocked ? <UserX size={44} className="text-amber" /> : <span className="font-display text-6xl text-white/20">?</span>}
        </div>
        <h3 className="font-display text-xl">{unlocked ? "Make the accusation" : "Suspect unknown"}</h3>
        <p className="mt-1 text-xs text-fog">
          {unlocked ? "All clues solved. Name the thief." : "Solve all five clues to unlock the accusation."}
        </p>
      </Link>
    </motion.div>
  );
}
