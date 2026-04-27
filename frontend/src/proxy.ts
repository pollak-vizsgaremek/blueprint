import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const proxy = async (request: NextRequest) => {
  const token = request.cookies.get("token");
  const pathname = request.nextUrl.pathname;

  if (
    !token?.value &&
    (pathname.startsWith("/app") || pathname.startsWith("/admin"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token?.value && pathname.startsWith("/admin")) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return NextResponse.redirect(new URL("/app", request.url));
    }

    try {
      const profileResponse = await fetch(`${apiUrl}/users/profile`, {
        headers: {
          cookie: `token=${token.value}`,
        },
        cache: "no-store",
      });

      if (profileResponse.status === 401) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      if (!profileResponse.ok) {
        return NextResponse.redirect(new URL("/app", request.url));
      }

      const profileData = await profileResponse.json();
      if (profileData?.user?.role !== "admin") {
        return NextResponse.redirect(new URL("/app", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  if (
    (pathname.startsWith("/login") || pathname.startsWith("/register")) &&
    token?.value
  ) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
};
