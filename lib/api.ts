import { NextResponse } from "next/server";
import { currentUser, type SessionUser } from "@/lib/supabase/server";

export const MAX_SQL_LENGTH = 5000;

export function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Every data route goes through this: signed-out callers get 401. */
export async function withUser(handler: (user: SessionUser) => Promise<Response>): Promise<Response> {
  const user = await currentUser();
  if (!user) return jsonError(401, "Sign in to investigate. Signed-out users cannot run or save queries.");
  try {
    return await handler(user);
  } catch (e) {
    console.error(e);
    return jsonError(500, "The evidence locker is jammed (server error). Try again.");
  }
}

export function parseSqlBody(body: unknown): { sql: string; questionId: number } | string {
  const b = body as { sql?: unknown; questionId?: unknown };
  if (typeof b?.sql !== "string" || !b.sql.trim()) return "Write a query first.";
  if (b.sql.length > MAX_SQL_LENGTH) return `Query too long (max ${MAX_SQL_LENGTH} characters).`;
  const questionId = Number(b.questionId);
  if (!Number.isInteger(questionId)) return "Unknown question.";
  return { sql: b.sql.trim().replace(/;\s*$/, ""), questionId };
}
