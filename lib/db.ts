import { Pool, type PoolClient, type CustomTypesConfig, type FieldDef, types } from "pg";
import Cursor from "pg-cursor";
import { pgConfig } from "@/lib/pgConfig";
import { checkSingleStatement } from "@/lib/sqlGuard";

export const MAX_ROWS = 500;

/**
 * Temporal, interval, int8 and numeric values come back as Postgres text so
 * results look exactly like they do in psql and grade deterministically.
 */
const RAW_TEXT_OIDS = new Set([20, 1082, 1083, 1114, 1184, 1186, 1700]);
export const TYPES: CustomTypesConfig = {
  getTypeParser: ((oid: number, format?: "text" | "binary") =>
    RAW_TEXT_OIDS.has(oid) ? (v: string) => v : types.getTypeParser(oid, format)) as CustomTypesConfig["getTypeParser"],
};

const globalPools = globalThis as unknown as { __takerPool?: Pool; __appPool?: Pool };

function makePool(envVar: string): Pool {
  const connectionString = process.env[envVar];
  if (!connectionString) throw new Error(`${envVar} is not set`);
  return new Pool({
    ...pgConfig(connectionString),
    // Session pooler slots are shared by every serverless instance; hold few and release fast.
    max: 2,
    idleTimeoutMillis: 3_000,
    connectionTimeoutMillis: 10_000,
    types: TYPES,
  });
}

/** Read-only role. The ONLY pool that ever executes student-written SQL. */
export function takerPool(): Pool {
  return (globalPools.__takerPool ??= makePool("TAKER_DATABASE_URL"));
}

/** Writer role for submissions + audit log. Only runs our own parameterized SQL. */
export function appPool(): Pool {
  return (globalPools.__appPool ??= makePool("APP_DATABASE_URL"));
}

export type Column = { name: string; type: string };
export type QueryOutcome =
  | { ok: true; columns: Column[]; rows: unknown[][]; rowCount: number; truncated: boolean; ms: number }
  | { ok: false; error: string; code?: string; position?: number; hint?: string; ms: number };

const TYPE_NAMES: Record<number, string> = {
  16: "bool", 20: "int8", 21: "int2", 23: "int4", 25: "text", 700: "float4", 701: "float8",
  1043: "varchar", 1082: "date", 1083: "time", 1114: "timestamp", 1184: "timestamptz",
  1186: "interval", 1700: "numeric", 2950: "uuid", 114: "json", 3802: "jsonb", 19: "name",
};

function readCursor(cursor: Cursor, n: number): Promise<{ rows: unknown[][]; fields: FieldDef[] }> {
  return new Promise((resolve, reject) => {
    cursor.read(n, (err, rows, result) => (err ? reject(err) : resolve({ rows: rows as unknown[][], fields: result.fields })));
  });
}

/**
 * Run untrusted SQL as quiz_taker inside a READ ONLY transaction that is
 * always rolled back. The cursor uses the extended query protocol, so
 * Postgres itself rejects multi-statement input ("SELECT 1; DROP ...").
 */
export async function runStudentSql(sql: string, opts: { explain?: boolean } = {}): Promise<QueryOutcome> {
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  const text = opts.explain ? `EXPLAIN (FORMAT JSON, COSTS true, VERBOSE false) ${sql}` : sql;
  const guard = checkSingleStatement(sql);
  if (guard) return { ok: false, error: guard, code: "42601", ms: ms() };

  let client: PoolClient | undefined;
  let broken: Error | undefined;
  const onError = (e: Error) => {
    broken = e;
  };
  try {
    client = await takerPool().connect();
    client.on("error", onError);
    await client.query("BEGIN READ ONLY");
    await client.query("SET LOCAL statement_timeout = '5s'");
    await client.query("SET LOCAL search_path = heist");

    const cursor = client.query(new Cursor(text, [], { rowMode: "array", types: TYPES }));
    const { rows, fields } = await readCursor(cursor, MAX_ROWS + 1);
    await cursor.close();

    return {
      ok: true,
      columns: fields.map((f) => ({ name: f.name, type: TYPE_NAMES[f.dataTypeID] ?? `oid:${f.dataTypeID}` })),
      rows: rows.slice(0, MAX_ROWS),
      rowCount: Math.min(rows.length, MAX_ROWS),
      truncated: rows.length > MAX_ROWS,
      ms: ms(),
    };
  } catch (e) {
    const err = e as { message?: string; code?: string; position?: string; hint?: string };
    return {
      ok: false,
      error: err.message ?? "Query failed",
      code: err.code,
      position: err.position ? Number(err.position) - (opts.explain ? text.length - sql.length : 0) : undefined,
      hint: err.hint,
      ms: ms(),
    };
  } finally {
    if (client) {
      if (!broken) await client.query("ROLLBACK").catch((e: Error) => (broken = e));
      client.off("error", onError);
      client.release(broken ?? undefined);
    }
  }
}

export type AuditAction = "run" | "save" | "hint" | "explain";

export async function logEvent(e: {
  userId: string; email: string; action: AuditAction; questionId: number | null;
  sql: string | null; rowCount: number | null; isCorrect: boolean | null;
}): Promise<void> {
  await appPool().query("SELECT audit.log_event($1, $2, $3, $4, $5, $6, $7)", [
    e.userId, e.email, e.action, e.questionId, e.sql, e.rowCount, e.isCorrect,
  ]);
}

export async function saveSubmission(s: {
  userId: string; email: string; questionId: number; sql: string; isCorrect: boolean; rowCount: number;
}): Promise<void> {
  await appPool().query(
    `INSERT INTO public.submissions (user_id, user_email, question_id, sql_text, is_correct, row_count)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [s.userId, s.email, s.questionId, s.sql, s.isCorrect, s.rowCount],
  );
}

export type Progress = Record<number, { solved: boolean; lastSql: string; savedAt: string; attempts: number }>;

export async function getProgress(userId: string): Promise<Progress> {
  const { rows } = await appPool().query<{
    question_id: number; solved: boolean; last_sql: string; saved_at: string; attempts: string;
  }>(
    `SELECT question_id,
            bool_or(is_correct) AS solved,
            (array_agg(sql_text ORDER BY created_at DESC))[1] AS last_sql,
            to_json(max(created_at)) #>> '{}' AS saved_at,
            count(*) AS attempts
     FROM public.submissions
     WHERE user_id = $1
     GROUP BY question_id`,
    [userId],
  );
  return Object.fromEntries(
    rows.map((r) => [r.question_id, { solved: r.solved, lastSql: r.last_sql, savedAt: r.saved_at, attempts: Number(r.attempts) }]),
  );
}

export type AuditRow = {
  id: string; user_email: string; action: AuditAction; question_id: number | null;
  sql_text: string | null; row_count: number | null; is_correct: boolean | null;
  created_at: string; row_hash: string; prev_hash: string;
};

export async function getAuditLog(opts: { limit: number; userId?: string; questionId?: number }): Promise<AuditRow[]> {
  const { rows } = await appPool().query<AuditRow>(
    `SELECT id, user_email, action, question_id, sql_text, row_count, is_correct,
            to_json(created_at) #>> '{}' AS created_at, row_hash, prev_hash
     FROM audit.log
     WHERE ($1::uuid IS NULL OR user_id = $1)
       AND ($2::int  IS NULL OR question_id = $2)
     ORDER BY id DESC
     LIMIT $3`,
    [opts.userId ?? null, opts.questionId ?? null, opts.limit],
  );
  return rows;
}

export async function verifyChain(): Promise<{ ok: boolean; totalRows: number; firstBadId: number | null }> {
  const { rows } = await appPool().query<{ ok: boolean; total_rows: string; first_bad_id: string | null }>(
    "SELECT * FROM audit.verify_chain()",
  );
  const r = rows[0];
  return { ok: r.ok, totalRows: Number(r.total_rows), firstBadId: r.first_bad_id ? Number(r.first_bad_id) : null };
}

export type Suspect = { id: number; name: string; role: string; motive: string; photo_emoji: string };

export async function getSuspects(): Promise<Suspect[]> {
  const { rows } = await takerPool().query<Suspect>(
    "SELECT id, name, role, motive, photo_emoji FROM heist.suspects ORDER BY id LIMIT $1",
    [20],
  );
  return rows;
}

export type SchemaTable = {
  table: string;
  rows: number;
  columns: { name: string; type: string; nullable: boolean; pk?: boolean; ref?: string }[];
};

export async function getSchema(): Promise<SchemaTable[]> {
  const keys = await takerPool().query<{ tbl: string; col: string; contype: "p" | "f"; ref_tbl: string | null; ref_col: string | null }>(
    `SELECT c.relname AS tbl, a.attname AS col, con.contype,
            rc.relname AS ref_tbl, ra.attname AS ref_col
     FROM pg_constraint con
     JOIN pg_class c      ON c.oid = con.conrelid
     JOIN pg_namespace ns ON ns.oid = c.relnamespace
     JOIN pg_attribute a  ON a.attrelid = c.oid AND a.attnum = con.conkey[1]
     LEFT JOIN pg_class rc     ON rc.oid = con.confrelid
     LEFT JOIN pg_attribute ra ON ra.attrelid = con.confrelid AND ra.attnum = con.confkey[1]
     WHERE ns.nspname = $1 AND con.contype IN ('p', 'f')`,
    ["heist"],
  );
  const keyMap = new Map(keys.rows.map((k) => [`${k.tbl}.${k.col}.${k.contype}`, k]));
  const { rows } = await takerPool().query<{ table_name: string; column_name: string; data_type: string; is_nullable: string }>(
    `SELECT table_name, column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = $1
     ORDER BY table_name, ordinal_position`,
    ["heist"],
  );
  const counts = await takerPool().query<{ relname: string; n: string }>(
    `SELECT c.relname, c.reltuples::bigint AS n
     FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
     WHERE ns.nspname = $1 AND c.relkind = 'r'`,
    ["heist"],
  );
  const countMap = new Map(counts.rows.map((r) => [r.relname, Math.max(0, Number(r.n))]));
  const tables = new Map<string, SchemaTable>();
  for (const r of rows) {
    if (!tables.has(r.table_name)) tables.set(r.table_name, { table: r.table_name, rows: countMap.get(r.table_name) ?? 0, columns: [] });
    const fk = keyMap.get(`${r.table_name}.${r.column_name}.f`);
    tables.get(r.table_name)!.columns.push({
      name: r.column_name,
      type: r.data_type,
      nullable: r.is_nullable === "YES",
      pk: keyMap.has(`${r.table_name}.${r.column_name}.p`),
      ref: fk ? `${fk.ref_tbl}.${fk.ref_col}` : undefined,
    });
  }
  return [...tables.values()];
}
