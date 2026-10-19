import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { freshDb } from "./pglite";

let db: PGlite;

const log = (email: string, action: string, sql: string) =>
  db.query("SELECT audit.log_event($1, $2, $3, $4, $5, $6, $7)", [
    "00000000-0000-0000-0000-000000000001", email, action, 1, sql, 3, null,
  ]);

const verify = async () =>
  (await db.query<{ ok: boolean; total_rows: string; first_bad_id: string | null }>(
    "SELECT * FROM audit.verify_chain()",
  )).rows[0];

beforeAll(async () => {
  db = await freshDb();
  await log("a@duke.edu", "run", "SELECT 1");
  await log("b@duke.edu", "save", "SELECT 2");
  await log("a@duke.edu", "hint", "");
});

describe("audit log integrity", () => {
  it("chains each row to the previous hash", async () => {
    const rows = (await db.query<{ prev_hash: string; row_hash: string }>(
      "SELECT prev_hash, row_hash FROM audit.log ORDER BY id",
    )).rows;
    expect(rows[0].prev_hash).toBe("GENESIS");
    expect(rows[1].prev_hash).toBe(rows[0].row_hash);
    expect(rows[2].prev_hash).toBe(rows[1].row_hash);
  });

  it("verify_chain() reports an intact log", async () => {
    expect(await verify()).toMatchObject({ ok: true, first_bad_id: null });
  });

  it.each([
    ["UPDATE", "UPDATE audit.log SET user_email = 'mallory@evil.com' WHERE id = 2"],
    ["DELETE", "DELETE FROM audit.log WHERE id = 2"],
    ["TRUNCATE", "TRUNCATE audit.log"],
  ])("blocks %s even for the table owner", async (_op, sql) => {
    await expect(db.exec(sql)).rejects.toThrow(/append-only/);
  });

  it("detects tampering if someone bypasses the triggers", async () => {
    await db.exec("ALTER TABLE audit.log DISABLE TRIGGER audit_log_no_update");
    await db.exec("UPDATE audit.log SET sql_text = 'SELECT 999' WHERE id = 2");
    await db.exec("ALTER TABLE audit.log ENABLE TRIGGER audit_log_no_update");
    const v = await verify();
    expect(v.ok).toBe(false);
    expect(Number(v.first_bad_id)).toBe(2);
  });
});
