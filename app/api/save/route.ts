import { NextResponse } from "next/server";
import { jsonError, parseSqlBody, withUser } from "@/lib/api";
import { ANSWERS } from "@/lib/answers";
import { gradeResult } from "@/lib/grading";
import { logEvent, runStudentSql, saveSubmission } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Submit an answer: re-run it server-side, grade the result set, record it. */
export async function POST(req: Request) {
  return withUser(async (user) => {
    const parsed = parseSqlBody(await req.json().catch(() => null));
    if (typeof parsed === "string") return jsonError(400, parsed);
    const key = ANSWERS[parsed.questionId];
    if (!key) return jsonError(404, "Unknown question.");

    const result = await runStudentSql(parsed.sql);
    if (!result.ok) return NextResponse.json({ result, grade: null, saved: false });

    const grade = gradeResult(result.rows, result.columns.length, key.rows);
    await saveSubmission({
      userId: user.id, email: user.email, questionId: parsed.questionId,
      sql: parsed.sql, isCorrect: grade.match, rowCount: result.rowCount,
    });
    await logEvent({
      userId: user.id, email: user.email, action: "save", questionId: parsed.questionId,
      sql: parsed.sql, rowCount: result.rowCount, isCorrect: grade.match,
    });
    // Expected rows stay server-side; only the count of missing rows is returned.
    const { missing, ...rest } = grade;
    return NextResponse.json({ result, grade: { ...rest, missing: missing.map(() => []) }, saved: true });
  });
}
