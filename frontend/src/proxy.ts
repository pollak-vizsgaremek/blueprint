import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const proxy = async (request: NextRequest) => {
  const token = request.cookies.get("token");
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const isRoleProtectedRoute = isAdminRoute || isTeacherRoute;

  if (
    !token?.value &&
    (pathname === "/" ||
      pathname.startsWith("/events") ||
      pathname.startsWith("/appointments") ||
      pathname.startsWith("/calendar") ||
      pathname.startsWith("/news") ||
      pathname.startsWith("/notifications") ||
      pathname.startsWith("/settings") ||
      isRoleProtectedRoute)
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token?.value && isRoleProtectedRoute) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return NextResponse.redirect(new URL("/", request.url));
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
        return NextResponse.redirect(new URL("/", request.url));
      }

      const profileData = await profileResponse.json();
      const role = profileData?.user?.role;

      if (isAdminRoute && role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      if (isTeacherRoute && role !== "teacher") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (
    (pathname.startsWith("/login") || pathname.startsWith("/register")) &&
    token?.value
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
};
