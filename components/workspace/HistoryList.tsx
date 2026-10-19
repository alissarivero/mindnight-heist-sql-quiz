"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, History, Play, RotateCcw, Send, XCircle } from "lucide-react";
import type { AuditRow } from "@/lib/db";
import { timeAgo } from "@/lib/time";

export function HistoryList({ questionId, refreshKey, onRestore }: { questionId: number; refreshKey: number; onRestore: (sql: string) => void }) {
  const [events, setEvents] = useState<AuditRow[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/history?q=${questionId}`)
      .then((r) => r.json())
      .then((d) => live && setEvents(d.ok ? d.events : []))
      .catch(() => live && setEvents([]));
    return () => {
      live = false;
    };
  }, [questionId, refreshKey]);

  if (!events) return <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-ink-3" />)}</div>;
  if (!events.length)
    return (
      <div className="grid place-items-center p-10 text-center text-sm text-fog">
        <History className="mb-2" /> No queries yet for this clue.
      </div>
    );

  return (
    <ul className="scrollbar-thin max-h-[360px] space-y-1.5 overflow-y-auto p-3">
      {events.map((e) => (
        <li key={e.id} className="group flex items-start gap-3 rounded-lg border border-line/60 bg-ink-3/40 p-2.5 hover:border-line">
          <span className="mt-0.5">
            {e.action === "save" ? (
              e.is_correct ? <CheckCircle2 size={15} className="text-evidence" /> : <XCircle size={15} className="text-blood" />
            ) : e.action === "run" ? <Play size={15} className="text-amber" /> : <Send size={15} className="text-sky-300" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] text-fog">
              <span className="font-semibold uppercase tracking-wider">{e.action}</span>
              <span>{timeAgo(e.created_at)}</span>
              {e.row_count != null && <span>· {e.row_count} rows</span>}
            </div>
            <pre className="mt-0.5 truncate font-mono text-[12px] text-paper/80">{e.sql_text?.replace(/\s+/g, " ")}</pre>
          </div>
          <button onClick={() => onRestore(e.sql_text ?? "")} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-fog opacity-0 hover:bg-ink-3 hover:text-amber group-hover:opacity-100">
            <RotateCcw size={12} /> Restore
          </button>
        </li>
      ))}
    </ul>
  );
}
