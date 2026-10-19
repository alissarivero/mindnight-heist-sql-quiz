"use client";

import { motion } from "motion/react";

export type PlanNode = {
  "Node Type": string;
  "Relation Name"?: string;
  Alias?: string;
  "Join Type"?: string;
  Strategy?: string;
  "Index Name"?: string;
  "Startup Cost": number;
  "Total Cost": number;
  "Plan Rows": number;
  "Hash Cond"?: string;
  "Join Filter"?: string;
  Filter?: string;
  "Sort Key"?: string[];
  "Group Key"?: string[];
  Plans?: PlanNode[];
};

const ICON: Record<string, string> = {
  "Seq Scan": "▤", "Index Scan": "⚡", "Index Only Scan": "⚡", "Bitmap Heap Scan": "▦", "Hash Join": "⋈", "Merge Join": "⋈",
  "Nested Loop": "↻", Hash: "#", Sort: "↕", Aggregate: "Σ", HashAggregate: "Σ", GroupAggregate: "Σ", Limit: "⤓",
  WindowAgg: "⧉", Unique: "◇", "CTE Scan": "◎", "Subquery Scan": "◎",
};

function Node({ node, rootCost, depth }: { node: PlanNode; rootCost: number; depth: number }) {
  const pct = rootCost ? Math.max(2, (node["Total Cost"] / rootCost) * 100) : 0;
  const detail = node["Hash Cond"] ?? node["Join Filter"] ?? node.Filter ?? (node["Sort Key"] ?? node["Group Key"])?.join(", ");
  return (
    <motion.li initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: depth * 0.06 }} className="relative">
      <div className="my-1 rounded-lg border border-line bg-ink-3/70 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded bg-amber/15 font-mono text-amber">{ICON[node["Node Type"]] ?? "•"}</span>
          <span className="font-semibold">
            {node["Join Type"] && node["Node Type"].includes("Join") ? `${node["Join Type"]} ` : ""}
            {node.Strategy && node["Node Type"] === "Aggregate" ? `${node.Strategy} ` : ""}
            {node["Node Type"]}
          </span>
          {node["Relation Name"] && (
            <span className="font-mono text-xs text-sky-300/90">
              on {node["Relation Name"]}{node.Alias && node.Alias !== node["Relation Name"] ? ` ${node.Alias}` : ""}
            </span>
          )}
          {node["Index Name"] && <span className="font-mono text-xs text-evidence">using {node["Index Name"]}</span>}
          <span className="ml-auto font-mono text-[11px] text-fog">
            cost {node["Startup Cost"].toFixed(2)}..{node["Total Cost"].toFixed(2)} · ~{node["Plan Rows"]} rows
          </span>
        </div>
        {detail && <div className="mt-1 truncate font-mono text-[11px] text-fog/80">{detail}</div>}
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink">
          <motion.div className="h-full bg-gradient-to-r from-amber to-blood" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
        </div>
      </div>
      {node.Plans && (
        <ul className="ml-5 border-l border-dashed border-line pl-4">
          {node.Plans.map((p, i) => <Node key={i} node={p} rootCost={rootCost} depth={depth + 1} />)}
        </ul>
      )}
    </motion.li>
  );
}

export function PlanTree({ plan }: { plan: { Plan: PlanNode } }) {
  const root = plan.Plan;
  return (
    <div className="p-4 text-sm">
      <p className="mb-2 text-xs text-fog">
        <span className="text-amber">EXPLAIN (FORMAT JSON)</span>: how Postgres plans to execute your query. The bar shows each node&apos;s share of the total estimated cost.
      </p>
      <ul>
        <Node node={root} rootCost={root["Total Cost"]} depth={0} />
      </ul>
    </div>
  );
}
