"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardPaste, Eye, FileLock2, Loader2, TableProperties } from "lucide-react";
import { toast } from "sonner";
import { ResultGrid } from "./ResultGrid";

type Hint = { sql: string; columns: string[]; rows: string[][] };

export function HintVault({ questionId, signedIn, onLoadSql }: { questionId: number; signedIn: boolean; onLoadSql: (sql: string) => void }) {
  const [hint, setHint] = useState<Hint | null>(null);
  const [tier, setTier] = useState(0);
  const [busy, setBusy] = useState(false);

  async function request() {
    setBusy(true);
    try {
      const res = await fetch(`/api/hint?q=${questionId}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setHint(data);
      setTier(1);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!hint) {
    return (
      <div className="grid place-items-center p-10 text-center">
        <FileLock2 size={36} className="mb-3 text-amber" />
        <h3 className="font-display text-xl">Evidence locker</h3>
        <p className="mt-1 max-w-sm text-sm text-fog">
          HQ keeps the expected SQL and the expected result on file. Requesting it is recorded in the case log.
        </p>
        <button className="btn-amber mt-4" disabled={!signedIn || busy} onClick={request}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />} Request evidence from HQ
        </button>
        {!signedIn && <p className="mt-2 text-xs text-fog">Sign in to request hints.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <AnimatePresence>
        <motion.div key="sql" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-fog">
            <span className="rounded bg-amber px-1.5 py-0.5 font-bold text-ink">Hint 1</span> Expected SQL
            <button className="ml-auto flex items-center gap-1 normal-case tracking-normal text-amber hover:underline" onClick={() => onLoadSql(hint.sql)}>
              <ClipboardPaste size={13} /> Load into editor
            </button>
          </div>
          <pre className="scrollbar-thin overflow-x-auto rounded-lg border border-line bg-[#100f0c] p-3 font-mono text-[12.5px] leading-relaxed text-paper/90">{hint.sql}</pre>
        </motion.div>
        {tier < 2 ? (
          <button key="reveal" className="btn-ghost" onClick={() => setTier(2)}>
            <TableProperties size={15} /> Reveal expected result
          </button>
        ) : (
          <motion.div key="rows" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-fog">
              <span className="rounded bg-amber px-1.5 py-0.5 font-bold text-ink">Hint 2</span> Expected result · {hint.rows.length} row{hint.rows.length === 1 ? "" : "s"}
            </div>
            <div className="overflow-hidden rounded-lg border border-line">
              <ResultGrid compact columns={hint.columns.map((name) => ({ name, type: "" }))} rows={hint.rows} />
            </div>
            <p className="mt-2 text-xs text-fog">Grading compares result sets. Row order and column names don&apos;t matter.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
