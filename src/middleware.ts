import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit public API endpoints: 100 req/min per IP
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, retryAfter } = checkRateLimit(ip, 100, 60_000);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }
  }

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req: request });

    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
