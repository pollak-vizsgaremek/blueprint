import type { Metadata } from "next";
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
  return <TeacherShell>{children}</TeacherShell>;
}
