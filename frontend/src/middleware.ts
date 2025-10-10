import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const middleware = async (request: NextRequest) => {
  const token = request.cookies.get("token");
  if (
    !token?.value &&
    (request.nextUrl.pathname.startsWith("/app") ||
      request.nextUrl.pathname.startsWith("/admin"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (
    (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/register")) &&
    token?.value
  ) {
    return NextResponse.redirect(new URL("/app", request.url));
  }
  // return NextResponse.redirect(new URL("/login", request.url));
};
