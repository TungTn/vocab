"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/user-store";
import { apiClient } from "@/lib/api-client";
import { AuthModal } from "@/components/auth/auth-modal";
import { ProfileModal } from "@/components/auth/profile-modal";
import {
  BookOpen,
  Layers,
  Mic,
  Trophy,
  ShoppingBag,
  Flame,
  Heart,
  Gem,
  Volume2,
  VolumeX,
  User,
  LogOut,
  Key,
  Shield,
  ChevronDown
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const {
    streak,
    hearts,
    gems,
    soundEnabled,
    toggleSound,
    isAuthenticated,
    username,
    email,
    role,
    avatarUrl,
    openAuthModal,
    openProfileModal,
    loginUser,
    logoutUser
  } = useUserStore();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-hydrate session from token on mount
  useEffect(() => {
    const token = apiClient.getToken();
    if (token) {
      apiClient
        .getMe()
        .then((user) => {
          if (user && user.userId) {
            loginUser(
              {
                id: user.userId,
                email: user.email,
                username: user.username,
                role: user.role
              },
              token
            );
          }
        })
        .catch(() => {
          // Token expired or invalid
          apiClient.logout();
        });
    }

    // Close menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [loginUser]);

  const navItems = [
    { href: "/learn", label: "Lộ Trình", icon: BookOpen },
    { href: "/flashcards", label: "Flashcards", icon: Layers },
    { href: "/speaking", label: "Luyện Nói AI", icon: Mic },
    { href: "/leaderboard", label: "Bảng Xếp Hạng", icon: Trophy },
    { href: "/shop", label: "Cửa Hàng", icon: ShoppingBag }
  ];

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await apiClient.logout();
    } catch {
      // ignore
    }
    logoutUser();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/learn" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center text-white font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform">
              LF
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">
              Lingua<span className="text-emerald-600">Flow</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Gamification Stats + Auth Actions */}
          <div className="flex items-center gap-3">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>

            {/* Streak */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-600 font-bold text-sm">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{streak}</span>
            </div>

            {/* Gems */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-cyan-600 font-bold text-sm">
              <Gem className="w-4 h-4 text-cyan-500 fill-cyan-400" />
              <span>{gems}</span>
            </div>

            {/* Hearts */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-full text-rose-600 font-bold text-sm">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>{hearts}</span>
            </div>

            {/* User Profile / Auth Actions */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-full border border-slate-200 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-black overflow-hidden shadow-sm">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                    ) : (
                      username.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800 max-w-[90px] truncate hidden sm:inline">
                    {username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-xs font-black text-slate-900 truncate">{username}</div>
                      <div className="text-[11px] text-slate-500 truncate">{email}</div>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        openProfileModal();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Hồ sơ & Thành tích</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        openProfileModal();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Key className="w-4 h-4 text-slate-400" />
                      <span>Đổi mật khẩu</span>
                    </button>

                    {role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2.5 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-indigo-500" />
                        <span>Trang Quản Trị CMS</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal("login")}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Đăng Nhập
                </button>
                <button
                  onClick={() => openAuthModal("register")}
                  className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm hover:shadow shadow-emerald-500/20 transition-all"
                >
                  Đăng Ký
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <AuthModal />
      <ProfileModal />
    </>
  );
}
