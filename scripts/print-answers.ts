/**
 * Prints every question's hint SQL and the rows it returns from the live
 * database (as quiz_taker), so a grader can compare against the README.
 * Usage: npm run db:answers
 */
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const { runStudentSql, takerPool } = await import("../lib/db");
  const { ANSWERS } = await import("../lib/answers");
  const { QUESTIONS } = await import("../lib/questions");
  const { gradeResult } = await import("../lib/grading");

  for (const q of QUESTIONS) {
    const key = ANSWERS[q.id];
    const res = await runStudentSql(key.hintSql);
    console.log(`\n=== Q${q.id} ${q.title} (${q.points} pts) ===\n${key.hintSql}\n`);
    if (!res.ok) {
      console.log("ERROR:", res.error);
      continue;
    }
    console.table(res.rows.map((r) => Object.fromEntries(res.columns.map((c, i) => [c.name, r[i]]))));
    console.log(gradeResult(res.rows, res.columns.length, key.rows).match ? "matches answer key" : "DOES NOT MATCH answer key");
  }
  await takerPool().end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
