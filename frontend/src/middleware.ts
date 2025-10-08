import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const middleware = async (request: NextRequest) => {
  const token = request.cookies.get("token");
  if (!token?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // return NextResponse.redirect(new URL("/login", request.url));
};

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
