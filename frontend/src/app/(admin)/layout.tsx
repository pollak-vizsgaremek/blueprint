import type { Metadata } from "next";
import { AdminGuard } from "./AdminGuard";

export const metadata: Metadata = {
  title: "Blueprint",
  description: "Esemény és időpont kezelő",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <AdminGuard>{children}</AdminGuard>
    </main>
  );
}
