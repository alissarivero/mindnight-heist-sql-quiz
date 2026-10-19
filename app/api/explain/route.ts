import { NextResponse } from "next/server";
import { jsonError, parseSqlBody, withUser } from "@/lib/api";
import { logEvent, runStudentSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withUser(async (user) => {
    const parsed = parseSqlBody(await req.json().catch(() => null));
    if (typeof parsed === "string") return jsonError(400, parsed);

    const result = await runStudentSql(parsed.sql, { explain: true });
    await logEvent({
      userId: user.id, email: user.email, action: "explain", questionId: parsed.questionId,
      sql: parsed.sql, rowCount: null, isCorrect: null,
    });
    if (!result.ok) return NextResponse.json(result);
    const plan = result.rows[0]?.[0];
    return NextResponse.json({ ok: true, plan: Array.isArray(plan) ? plan[0] : plan, ms: result.ms });
  });
}
