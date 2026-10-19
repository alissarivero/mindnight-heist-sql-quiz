import { NextResponse } from "next/server";
import { jsonError, withUser } from "@/lib/api";
import { ANSWERS } from "@/lib/answers";
import { logEvent } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withUser(async (user) => {
    const questionId = Number(new URL(req.url).searchParams.get("q"));
    const key = ANSWERS[questionId];
    if (!key) return jsonError(404, "Unknown question.");

    await logEvent({
      userId: user.id, email: user.email, action: "hint", questionId,
      sql: null, rowCount: null, isCorrect: null,
    });
    return NextResponse.json({ ok: true, sql: key.hintSql, columns: key.columns, rows: key.rows });
  });
}
