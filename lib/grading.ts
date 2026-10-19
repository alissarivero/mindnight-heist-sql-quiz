/**
 * Result-set grading. Two results match when they have the same number of
 * columns and the same multiset of rows. Row order, column names, and
 * cosmetic formatting (21 vs 21.000000, timestamp "T" separator) are ignored.
 */

export type Cell = string;
export type Row = Cell[];

export type GradeResult = {
  match: boolean;
  columnCountOk: boolean;
  expectedColumns: number;
  actualColumns: number;
  missing: Row[];
  extra: Row[];
};

const NUMERIC = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;
const ISO_TS = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}(\.\d+)?)/;

function canonicalNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return String(Number(n.toFixed(4)));
}

export function normalizeCell(value: unknown): Cell {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return canonicalNumber(value);
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) {
    return value.toISOString().replace("T", " ").replace(/\.000Z$|Z$/, "");
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (NUMERIC.test(s)) return canonicalNumber(Number(s));
    const iso = s.match(ISO_TS);
    if (iso) return `${iso[1]} ${iso[2]}`;
    return s;
  }
  return JSON.stringify(value);
}

export function normalizeRows(rows: unknown[][]): Row[] {
  return rows.map((r) => r.map(normalizeCell));
}

const key = (r: Row) => JSON.stringify(r);

export function gradeResult(actualRaw: unknown[][], actualColumnCount: number, expected: Row[]): GradeResult {
  const actual = normalizeRows(actualRaw);
  const expectedNorm = normalizeRows(expected);
  const expectedColumns = expectedNorm[0]?.length ?? 0;
  const columnCountOk = actualColumnCount === expectedColumns;

  const remaining = new Map<string, number>();
  for (const r of expectedNorm) remaining.set(key(r), (remaining.get(key(r)) ?? 0) + 1);

  const extra: Row[] = [];
  for (const r of actual) {
    const n = remaining.get(key(r)) ?? 0;
    if (n > 0) remaining.set(key(r), n - 1);
    else extra.push(r);
  }
  const missing: Row[] = [];
  for (const r of expectedNorm) {
    const n = remaining.get(key(r)) ?? 0;
    if (n > 0) {
      missing.push(r);
      remaining.set(key(r), n - 1);
    }
  }

  return {
    match: columnCountOk && missing.length === 0 && extra.length === 0,
    columnCountOk,
    expectedColumns,
    actualColumns: actualColumnCount,
    missing,
    extra,
  };
}
