import type { Metadata } from "next";
import { TeacherGuard } from "./TeacherGuard";
import { TeacherShell } from "./components/TeacherShell";

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
    <TeacherGuard>
      <TeacherShell>{children}</TeacherShell>
    </TeacherGuard>
  );
}
