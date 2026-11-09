import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinguaFlow - Nền Tảng Học Ngoại Ngữ Thông Minh",
  description: "Học từ vựng với FSRS, bài học tương tác, trợ lý phát âm AI và bảng xếp hạng hấp dẫn."
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
