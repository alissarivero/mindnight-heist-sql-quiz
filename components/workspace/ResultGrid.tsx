"use client";

import { Download } from "lucide-react";
import type { Column } from "@/lib/db";

function toCsv(columns: Column[], rows: unknown[][]) {
  const esc = (v: unknown) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.map((c) => esc(c.name)).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

export function ResultGrid({ columns, rows, highlight, compact = false, csvName }: {
  columns: Column[]; rows: unknown[][]; highlight?: "missing" | "extra"; compact?: boolean; csvName?: string;
}) {
  if (!columns.length) return <p className="p-4 text-sm text-fog">Query returned no columns.</p>;

  return (
    <div className="relative">
      {csvName && rows.length > 0 && (
        <button
          className="absolute right-2 top-1.5 z-10 flex items-center gap-1 rounded-md bg-ink-3/90 px-2 py-1 text-[11px] text-fog hover:text-paper"
          onClick={() => {
            const url = URL.createObjectURL(new Blob([toCsv(columns, rows)], { type: "text/csv" }));
            Object.assign(document.createElement("a"), { href: url, download: `${csvName}.csv` }).click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download size={12} /> CSV
        </button>
      )}
      <div className={`scrollbar-thin overflow-auto ${compact ? "max-h-56" : "max-h-[360px]"}`}>
        <table className="w-full border-separate border-spacing-0 font-mono text-[12.5px]">
          <thead className="sticky top-0 z-[1]">
            <tr>
              <th className="w-10 border-b border-line bg-ink-3 px-2 py-2 text-right text-[10px] font-normal text-fog/60">#</th>
              {columns.map((c, i) => (
                <th key={i} className="whitespace-nowrap border-b border-line bg-ink-3 px-3 py-2 text-left font-semibold text-paper">
                  {c.name}
                  {c.type && <span className="ml-1.5 rounded bg-ink px-1 py-0.5 text-[9.5px] font-normal uppercase text-amber/80">{c.type}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={
                  highlight === "missing" ? "bg-evidence/10" : highlight === "extra" ? "bg-blood/10" : "odd:bg-white/[0.015] hover:bg-amber/[0.06]"
                }
              >
                <td className="border-b border-line/50 px-2 py-1.5 text-right text-[10px] text-fog/50">{i + 1}</td>
                {r.map((v, j) => (
                  <td key={j} className="max-w-[340px] truncate whitespace-nowrap border-b border-line/50 px-3 py-1.5" title={v == null ? "NULL" : String(v)}>
                    {v == null ? (
                      <span className="rounded bg-ink-3 px-1 text-[10px] italic text-fog">NULL</span>
                    ) : typeof v === "boolean" ? (
                      <span className={v ? "text-evidence" : "text-blood"}>{String(v)}</span>
                    ) : typeof v === "object" ? (
                      JSON.stringify(v)
                    ) : (
                      String(v)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-fog">0 rows. The trail goes cold.</p>}
      </div>
    </div>
  );
}
