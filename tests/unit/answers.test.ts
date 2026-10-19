import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { ANSWERS } from "@/lib/answers";
import { QUESTIONS, TOTAL_POINTS } from "@/lib/questions";
import { gradeResult } from "@/lib/grading";
import { freshDb } from "./pglite";

let db: PGlite;
beforeAll(async () => {
  db = await freshDb();
});

describe("quiz structure", () => {
  it("is worth exactly 20 points", () => {
    expect(TOTAL_POINTS).toBe(20);
  });
  it("has an answer key for every question", () => {
    for (const q of QUESTIONS) expect(ANSWERS[q.id]).toBeDefined();
  });
});

describe("hint SQL returns the documented expected result (seed data)", () => {
  for (const q of QUESTIONS) {
    it(`Q${q.id} ${q.title}`, async () => {
      const key = ANSWERS[q.id];
      const res = await db.query<unknown[]>(key.hintSql, [], { rowMode: "array" });
      const grade = gradeResult(res.rows, res.fields.length, key.rows);
      expect(grade).toMatchObject({ match: true, missing: [], extra: [] });
      expect(res.fields.map((f) => f.name)).toEqual(key.columns);
    });
  }
});

describe("story consistency", () => {
  it("exactly one suspect survives clues 3 and 4 and wins clue 5", () => {
    const shaky = new Set(ANSWERS[3].rows.map((r) => r[0]));
    const onCamera = ANSWERS[4].rows.map((r) => r[0]).filter((n) => shaky.has(n));
    expect(onCamera).toContain(ANSWERS[5].rows[0][0]);
  });
});
