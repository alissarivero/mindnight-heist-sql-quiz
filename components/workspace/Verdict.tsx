"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import type { GradeResult } from "@/lib/grading";
import { ResultGrid } from "./ResultGrid";
import { Stamp } from "@/components/Stamp";

export function Verdict({ grade, solvedNote, onClose }: { grade: GradeResult; solvedNote: string; onClose: () => void }) {
  const cols = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `col ${i + 1}`, type: "" }));
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border p-5 ${grade.match ? "border-evidence/50 bg-evidence/[0.07]" : "border-blood/50 bg-blood/[0.07]"}`}
      role="status"
    >
      <button onClick={onClose} className="absolute right-3 top-3 text-fog hover:text-paper" aria-label="Dismiss verdict"><X size={16} /></button>
      <div className="flex flex-wrap items-center gap-5">
        <Stamp text={grade.match ? "Match" : "No match"} tone={grade.match ? "green" : "red"} className="mix-blend-normal text-2xl" />
        <div className="min-w-0 flex-1">
          {grade.match ? (
            <>
              <div className="font-display text-xl text-evidence">The evidence checks out.</div>
              <p className="mt-1 text-sm text-paper/80">{solvedNote}</p>
            </>
          ) : (
            <>
              <div className="font-display text-xl text-blood">The evidence doesn&apos;t add up.</div>
              <p className="mt-1 text-sm text-paper/80">
                {!grade.columnCountOk
                  ? `Expected ${grade.expectedColumns} column${grade.expectedColumns === 1 ? "" : "s"}, your query returned ${grade.actualColumns}.`
                  : `${grade.missing.length} expected row${grade.missing.length === 1 ? " is" : "s are"} missing and ${grade.extra.length} row${grade.extra.length === 1 ? "" : "s"} shouldn't be there.`}
                {" "}Your answer was saved. Adjust it and submit again.
              </p>
            </>
          )}
        </div>
      </div>

      {!grade.match && grade.columnCountOk && (grade.missing.length > 0 || grade.extra.length > 0) && (
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_2fr]">
          <div className="rounded-lg border border-line bg-ink/40 p-3">
            <div className="text-xs uppercase tracking-widest text-evidence">Missing rows</div>
            <div className="mt-1 font-display text-3xl">{grade.missing.length}</div>
            <p className="mt-1 text-xs text-fog">Expected rows stay sealed. Open the evidence locker (Hint tab) if you&apos;re stuck.</p>
          </div>
          <div>
            <div className="mb-1 text-xs uppercase tracking-widest text-blood">Rows that shouldn&apos;t be there ({grade.extra.length})</div>
            <div className="overflow-hidden rounded-lg border border-line">
              {grade.extra.length ? <ResultGrid compact highlight="extra" columns={cols(grade.actualColumns)} rows={grade.extra} /> : <p className="p-3 text-xs text-fog">None. You&apos;re only missing rows.</p>}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
