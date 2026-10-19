"use client";

import { useState } from "react";
import { ChevronRight, Database, KeyRound, Link2, Table2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { SchemaTable } from "@/lib/db";

const SHORT: Record<string, string> = {
  integer: "int", "timestamp without time zone": "timestamp", numeric: "numeric", text: "text", boolean: "bool",
};

export function SchemaExplorer({ schema, loading, onInsert, signedIn }: {
  schema: SchemaTable[]; loading: boolean; onInsert: (text: string) => void; signedIn: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ suspects: true, keycard_swipes: true });

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5 text-xs uppercase tracking-widest text-fog">
        <Database size={13} className="text-amber" /> Schema · heist
        <span className="ml-auto normal-case tracking-normal text-fog/60">click to insert</span>
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto p-1.5 font-mono text-[12.5px]">
        {!signedIn && <p className="p-3 font-sans text-sm text-fog">Sign in to browse the live schema.</p>}
        {signedIn && loading && Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="m-1.5 h-6 animate-pulse rounded bg-ink-3" style={{ width: `${60 + ((i * 17) % 35)}%` }} />
        ))}
        {schema.map((t) => (
          <div key={t.table}>
            <div className="group flex items-center rounded-md hover:bg-ink-3">
              <button
                onClick={() => setOpen((o) => ({ ...o, [t.table]: !o[t.table] }))}
                className="p-1.5 text-fog"
                aria-label={`Toggle ${t.table}`}
                aria-expanded={!!open[t.table]}
              >
                <ChevronRight size={13} className={`transition-transform ${open[t.table] ? "rotate-90" : ""}`} />
              </button>
              <button onClick={() => onInsert(t.table)} className="flex flex-1 items-center gap-1.5 py-1.5 pr-2 text-left text-paper">
                <Table2 size={13} className="text-amber/80" />
                {t.table}
                <span className="ml-auto text-[10px] text-fog/70">{t.rows}</span>
              </button>
            </div>
            <AnimatePresence initial={false}>
              {open[t.table] && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="ml-5 overflow-hidden border-l border-line pl-2"
                >
                  {t.columns.map((c) => (
                    <li key={c.name}>
                      <button
                        onClick={() => onInsert(c.name)}
                        className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-paper/85 hover:bg-ink-3"
                        title={c.ref ? `references ${c.ref}` : undefined}
                      >
                        {c.pk ? <KeyRound size={11} className="text-amber" /> : c.ref ? <Link2 size={11} className="text-sky-400/80" /> : <span className="w-[11px]" />}
                        <span>{c.name}</span>
                        <span className="ml-auto text-[10px] text-fog/70">{SHORT[c.type] ?? c.type}{c.nullable ? "?" : ""}</span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      {schema.length > 0 && (
        <div className="border-t border-line px-3 py-2 text-[11px] text-fog">
          <KeyRound size={10} className="inline text-amber" /> primary key &nbsp; <Link2 size={10} className="inline text-sky-400/80" /> foreign key &nbsp; ? nullable
        </div>
      )}
    </div>
  );
}
