import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...options,
            // Ensure cookies persist across reloads on mobile
            maxAge: options?.maxAge ?? 60 * 60 * 24 * 400, // 400 days
            path: options?.path ?? "/",
            sameSite: options?.sameSite ?? "lax",
          })
        );
      },
    },
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
      sameSite: "lax",
    },
  });

  // Refresh session if expired (tolerate failures so a blip doesn't clear cookies)
  try {
    await supabase.auth.getUser();
  } catch {
    // network issue — don't clear cookies, just pass through
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
