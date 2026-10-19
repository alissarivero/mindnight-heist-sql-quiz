import { NextResponse } from "next/server";
import { withUser } from "@/lib/api";
import { getAuditLog } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withUser(async (user) => {
    const q = Number(new URL(req.url).searchParams.get("q"));
    const rows = await getAuditLog({ limit: 30, userId: user.id, questionId: Number.isInteger(q) ? q : undefined });
    return NextResponse.json({ ok: true, events: rows.filter((r) => r.sql_text) });
  });
}
