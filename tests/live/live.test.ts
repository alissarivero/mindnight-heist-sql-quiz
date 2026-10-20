/**
 * Runs against the real Supabase database. In CI the connection strings come
 * from GitHub Secrets; locally from .env.local. Skipped when not configured
 * (outside CI) so `npm test` works offline.
 */
import { config } from "dotenv";
import { afterAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { pgConfig } from "@/lib/pgConfig";
import { ANSWERS } from "@/lib/answers";
import { QUESTIONS } from "@/lib/questions";
import { gradeResult } from "@/lib/grading";

config({ path: [".env.local", ".env"], quiet: true });

const REQUIRED = ["DATABASE_URL", "APP_DATABASE_URL", "TAKER_DATABASE_URL"] as const;
const configured = REQUIRED.every((k) => process.env[k]);
if (process.env.CI && !configured) {
  throw new Error(`Missing GitHub Secrets: ${REQUIRED.filter((k) => !process.env[k]).join(", ")}`);
}

const clients: Client[] = [];
async function connect(envVar: (typeof REQUIRED)[number]) {
  const { TYPES } = await import("@/lib/db");
  const c = new Client({ ...pgConfig(process.env[envVar]!), types: TYPES });
  await c.connect();
  clients.push(c);
  return c;
}
afterAll(async () => {
  await Promise.all(clients.map((c) => c.end()));
});

/** Expect a statement to fail; runs inside a rolled-back transaction. */
async function expectDenied(c: Client, sql: string, pattern: RegExp) {
  await c.query("BEGIN");
  try {
    await expect(c.query(sql)).rejects.toThrow(pattern);
  } finally {
    await c.query("ROLLBACK");
  }
}

describe.skipIf(!configured)("live Supabase database", () => {
  it("connects through the session pooler over TLS", async () => {
    const c = await connect("DATABASE_URL");
    expect(new URL(process.env.DATABASE_URL!).hostname).toMatch(/pooler\.supabase\.com$/);
    // pg_stat_ssl would describe the pooler's backend link, so inspect our own socket instead.
    const socket = (c as unknown as { connection: { stream: { encrypted?: boolean } } }).connection.stream;
    expect(socket.encrypted).toBe(true);
  });

  describe("every hint returns its documented expected result (as quiz_taker)", () => {
    for (const q of QUESTIONS) {
      it(`Q${q.id} ${q.title}`, async () => {
        const c = await connect("TAKER_DATABASE_URL");
        await c.query("SET search_path = heist");
        const res = await c.query({ text: ANSWERS[q.id].hintSql, rowMode: "array" });
        expect(gradeResult(res.rows, res.fields.length, ANSWERS[q.id].rows).match).toBe(true);
      });
    }
  });

  describe("quiz_taker is read-only and cannot reach the audit log", () => {
    it.each([
      ["write case data", "INSERT INTO heist.suspects VALUES (99, 'x', 'x', 'x', 'x')"],
      ["read the audit log", "SELECT * FROM audit.log"],
      ["edit the audit log", "UPDATE audit.log SET user_email = 'x'"],
      ["delete the audit log", "DELETE FROM audit.log"],
      ["forge an audit entry", "SELECT audit.log_event(NULL, 'x', 'run', 1, 'x', 0, NULL)"],
      ["read submissions", "SELECT * FROM public.submissions"],
    ])("cannot %s", async (_label, sql) => {
      const c = await connect("TAKER_DATABASE_URL");
      await expectDenied(c, sql, /read-only|permission denied/);
    });

    it("lacks write privileges even if read-only mode is switched off", async () => {
      const c = await connect("TAKER_DATABASE_URL");
      await expectDenied(c, "SET TRANSACTION READ WRITE; INSERT INTO heist.rooms VALUES (99, 'x', 1, 1)", /permission denied/);
    });
  });

  describe("the app's student-SQL runner", () => {
    it("rejects stacked statements (SQL injection)", async () => {
      const { runStudentSql } = await import("@/lib/db");
      const res = await runStudentSql("SELECT 1; DROP TABLE heist.suspects");
      expect(res.ok).toBe(false);
      expect(!res.ok && res.error).toMatch(/One statement at a time|multiple commands/);
    });

    it("returns rows from the live case data", async () => {
      const { runStudentSql } = await import("@/lib/db");
      const res = await runStudentSql("SELECT count(*) FROM suspects");
      expect(res.ok && res.rows[0][0]).toBe("10");
    });

    afterAll(async () => {
      const { takerPool } = await import("@/lib/db");
      await takerPool().end();
    });
  });

  describe("quiz_app can append but never rewrite history", () => {
    it.each([
      ["UPDATE", "UPDATE audit.log SET user_email = 'x'"],
      ["DELETE", "DELETE FROM audit.log"],
      ["TRUNCATE", "TRUNCATE audit.log"],
      ["direct INSERT", "INSERT INTO audit.log (user_email, action, prev_hash, row_hash) VALUES ('x', 'run', 'x', 'x')"],
    ])("blocks %s", async (_op, sql) => {
      const c = await connect("APP_DATABASE_URL");
      await expectDenied(c, sql, /permission denied|append-only/);
    });
  });

  it("even the database owner hits the append-only trigger", async () => {
    const c = await connect("DATABASE_URL");
    await c.query("BEGIN");
    await c.query("SELECT audit.log_event(NULL, 'ci@github-actions', 'run', NULL, 'SELECT 1', 1, NULL)");
    await expect(c.query("UPDATE audit.log SET user_email = 'mallory' WHERE id = (SELECT max(id) FROM audit.log)")).rejects.toThrow(/append-only/);
    await c.query("ROLLBACK");
  });

  it("the audit hash chain is intact", async () => {
    const c = await connect("APP_DATABASE_URL");
    const { rows } = await c.query("SELECT * FROM audit.verify_chain()");
    expect(rows[0]).toMatchObject({ ok: true, first_bad_id: null });
  });
});
