import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "AI学習ナビ - 初心者のための動画キュレーション",
  description:
    "AI・プログラミング初心者が迷わず今見るべき動画に辿り着けるキュレーションサービス",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        <SessionProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="bg-slate-800 text-slate-300 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm">
              <p>AI学習ナビ &copy; 2025 - 初心者のための動画キュレーション</p>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
