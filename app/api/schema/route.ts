import { NextResponse } from "next/server";
import { withUser } from "@/lib/api";
import { getSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return withUser(async () => NextResponse.json({ ok: true, tables: await getSchema() }));
}
