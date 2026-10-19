import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Landing point for magic-link and email-confirmation links. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/case", url.origin));
}
