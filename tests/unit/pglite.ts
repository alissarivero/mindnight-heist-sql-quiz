import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "fs";
import path from "path";

const sqlFile = (name: string) => readFileSync(path.join(__dirname, "../../sql", name), "utf8");

const raw = (v: string) => v;
/** Same raw-text parsing the app uses for temporal/numeric types (lib/db.ts). */
export const RAW_PARSERS = { 20: raw, 1082: raw, 1083: raw, 1114: raw, 1184: raw, 1186: raw, 1700: raw };

/** In-process Postgres loaded with the case schema, seed data, and audit log. */
export async function freshDb(): Promise<PGlite> {
  const db = new PGlite({ parsers: RAW_PARSERS });
  await db.exec(sqlFile("01_schema.sql"));
  await db.exec(sqlFile("02_seed.sql"));
  await db.exec(sqlFile("03_app.sql"));
  await db.exec("SET search_path TO heist, public");
  return db;
}
