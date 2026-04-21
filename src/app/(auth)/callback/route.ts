import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorDesc =
    url.searchParams.get("error_description") || url.searchParams.get("error");
  const origin = url.origin;

  if (errorDesc) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDesc)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }
    // Success
    return NextResponse.redirect(`${origin}/feed`);
  }

  // No code and no error — just bounce to feed (session may already be set) or login
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return NextResponse.redirect(`${origin}/feed`);
  return NextResponse.redirect(`${origin}/login`);
}
