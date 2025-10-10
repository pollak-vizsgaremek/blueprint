import type { Metadata } from "next";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ModalProvider } from "@/contexts/ModalContext";
import { EventModal } from "./components/EventModal";

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
    <ModalProvider>
      <div className="pt-36">
        <Header />
        {children}
        <Footer />
      </div>
      <EventModal />
    </ModalProvider>
  );
}
