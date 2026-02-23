"use client";

import Link from "next/link";
import { useState, memo } from "react";
import { Menu, X, BookOpen, Search, LayoutDashboard, LogIn, LogOut, User } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

export const Header = memo(function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const isAdmin = session?.user?.role === "admin";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
            <BookOpen className="w-6 h-6" />
            AI学習ナビ
          </Link>

          <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="メインナビゲーション">
            <Link href="/videos" className="flex items-center gap-1 text-slate-600 hover:text-primary-600 transition-colors">
              <Search className="w-4 h-4" />
              動画を探す
            </Link>
            <Link href="/paths" className="flex items-center gap-1 text-slate-600 hover:text-primary-600 transition-colors">
              <BookOpen className="w-4 h-4" />
              学習トラック
            </Link>
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-1 text-slate-600 hover:text-primary-600 transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                管理
              </Link>
            )}

            {status === "authenticated" && session?.user ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-7 h-7 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="max-w-[120px] truncate">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </button>
              </div>
            ) : status === "unauthenticated" ? (
              <button
                onClick={() => signIn()}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-primary-600 transition-colors ml-2"
              >
                <LogIn className="w-4 h-4" />
                ログイン
              </button>
            ) : null}
          </nav>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2" role="navigation" aria-label="モバイルナビゲーション">
            <Link href="/videos" className="block px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100" onClick={() => setIsMenuOpen(false)}>
              動画を探す
            </Link>
            <Link href="/paths" className="block px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100" onClick={() => setIsMenuOpen(false)}>
              学習トラック
            </Link>
            {isAdmin && (
              <Link href="/admin" className="block px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100" onClick={() => setIsMenuOpen(false)}>
                管理
              </Link>
            )}

            {status === "authenticated" && session?.user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="truncate">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </button>
              </>
            ) : status === "unauthenticated" ? (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signIn();
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100"
              >
                <LogIn className="w-4 h-4" />
                ログイン
              </button>
            ) : null}
          </nav>
        )}
      </div>
    </header>
  );
});
