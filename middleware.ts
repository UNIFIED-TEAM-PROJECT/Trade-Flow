import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "./src/lib/auth";

const protectedPrefixes = ["/app", "/technician", "/customer"];
const authPages = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (hasSession && authPages.some((page) => pathname.startsWith(page))) {
    return NextResponse.redirect(new URL("/app/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/technician/:path*", "/customer/:path*", "/login", "/signup"],
};
