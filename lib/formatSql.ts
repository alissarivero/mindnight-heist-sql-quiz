const KEYWORDS = [
  "select", "distinct", "from", "where", "and", "or", "not", "in", "is", "null", "as", "on", "join", "left", "right",
  "inner", "outer", "full", "cross", "group", "by", "order", "having", "limit", "offset", "with", "union", "all",
  "exists", "between", "like", "ilike", "case", "when", "then", "else", "end", "asc", "desc", "count", "sum", "avg",
  "min", "max", "over", "partition", "lead", "lag", "row_number", "rank", "dense_rank", "interval", "timestamp",
  "extract", "epoch", "coalesce", "true", "false", "cast", "filter", "using", "except", "intersect",
];
const KW = new RegExp(`\\b(${KEYWORDS.join("|")})\\b`, "gi");
const CLAUSES = /\s+(FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|UNION ALL|UNION|(?:LEFT |RIGHT |INNER |FULL |CROSS )?(?:OUTER )?JOIN)\b/g;
const CONDITIONS = /\s+(AND|OR)\s+/g;

/** Lightweight formatter: uppercases keywords and breaks major clauses onto new lines. */
export function formatSql(sql: string): string {
  const literals: string[] = [];
  const masked = sql.replace(/'(?:[^']|'')*'|"(?:[^"])*"|--[^\n]*/g, (m) => {
    literals.push(m);
    return `\u0000${literals.length - 1}\u0000`;
  });
  const out = masked
    .replace(KW, (m) => m.toUpperCase())
    .replace(CLAUSES, "\n$1")
    .replace(CONDITIONS, "\n  $1 ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => literals[Number(i)]);
}
