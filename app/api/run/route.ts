import { NextResponse } from "next/server";
import { jsonError, parseSqlBody, withUser } from "@/lib/api";
import { logEvent, runStudentSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withUser(async (user) => {
    const parsed = parseSqlBody(await req.json().catch(() => null));
    if (typeof parsed === "string") return jsonError(400, parsed);

    const result = await runStudentSql(parsed.sql);
    await logEvent({
      userId: user.id, email: user.email, action: "run", questionId: parsed.questionId,
      sql: parsed.sql, rowCount: result.ok ? result.rowCount : null, isCorrect: null,
    });
    return NextResponse.json(result);
  });
}
