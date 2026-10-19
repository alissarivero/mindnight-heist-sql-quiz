/**
 * Builds the quiz database on Supabase (idempotent):
 *   1. heist schema + seed data (rebuilt every run)
 *   2. submissions table + hash-chained audit log (preserved across runs)
 *   3. quiz_app / quiz_taker login roles and least-privilege grants
 *
 * Usage: npm run db:setup   (reads DATABASE_URL, QUIZ_APP_PASSWORD, QUIZ_TAKER_PASSWORD
 *                            from .env.local / .env or the environment)
 */
import { config } from "dotenv";
import { readFileSync } from "fs";
import path from "path";
import { Client } from "pg";
import { pgConfig } from "../lib/pgConfig";

config({ path: [".env.local", ".env"], quiet: true });

function need(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
    process.exit(1);
  }
  return v;
}

const sql = (file: string) => readFileSync(path.join(__dirname, "..", "sql", file), "utf8");

async function main() {
  const client = new Client(pgConfig(need("DATABASE_URL")));
  const appPw = need("QUIZ_APP_PASSWORD");
  const takerPw = need("QUIZ_TAKER_PASSWORD");
  await client.connect();
  console.log("Connected to", new URL(need("DATABASE_URL")).host);

  try {
    await client.query("BEGIN");
    for (const file of ["01_schema.sql", "02_seed.sql", "03_app.sql"]) {
      await client.query(sql(file));
      console.log("  applied", file);
    }

    for (const [role, pw] of [["quiz_app", appPw], ["quiz_taker", takerPw]] as const) {
      const { rowCount } = await client.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [role]);
      // Role names/passwords can't be bind parameters in DDL; they're escaped instead.
      const verb = rowCount ? "ALTER" : "CREATE";
      await client.query(`${verb} ROLE ${client.escapeIdentifier(role)} WITH LOGIN NOINHERIT PASSWORD ${client.escapeLiteral(pw)}`);
      console.log(`  ${verb.toLowerCase()}d role`, role);
    }

    await client.query(sql("04_grants.sql"));
    console.log("  applied 04_grants.sql");
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  }

  const { rows } = await client.query(
    `SELECT relname AS table, n_live_tup AS rows FROM pg_stat_user_tables WHERE schemaname = 'heist' ORDER BY relname`,
  );
  const counts = await Promise.all(
    rows.map(async (r) => [r.table, (await client.query(`SELECT count(*)::int AS n FROM heist.${client.escapeIdentifier(r.table)}`)).rows[0].n]),
  );
  console.table(Object.fromEntries(counts));
  const chain = (await client.query("SELECT * FROM audit.verify_chain()")).rows[0];
  console.log("Audit chain:", chain.ok ? `intact (${chain.total_rows} entries)` : `BROKEN at #${chain.first_bad_id}`);
  await client.end();
  console.log("Done. The case is open.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
