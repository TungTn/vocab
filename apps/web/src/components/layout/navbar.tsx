"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/user-store";
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
  VolumeX
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { streak, hearts, gems, soundEnabled, toggleSound } = useUserStore();

  const navItems = [
    { href: "/learn", label: "Lộ Trình", icon: BookOpen },
    { href: "/flashcards", label: "Flashcards", icon: Layers },
    { href: "/speaking", label: "Luyện Nói AI", icon: Mic },
    { href: "/leaderboard", label: "Bảng Xếp Hạng", icon: Trophy },
    { href: "/shop", label: "Cửa Hàng", icon: ShoppingBag }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
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

        {/* Gamification Stats Status Bar */}
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
        </div>
      </div>
    </header>
  );
}
