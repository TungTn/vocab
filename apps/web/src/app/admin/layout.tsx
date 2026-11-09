"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileSpreadsheet,
  BarChart3,
  Users,
  ShieldCheck
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/admin", label: "Tổng Quan", icon: LayoutDashboard },
    { href: "/admin/courses", label: "Khóa Học & Bài Giảng", icon: BookOpen },
    { href: "/admin/vocabulary", label: "Nhập Từ Vựng Bulk", icon: FileSpreadsheet },
    { href: "/admin/analytics", label: "Thống Kê & Heatmap", icon: BarChart3 },
    { href: "/admin/users", label: "Quản Lý Học Viên", icon: Users }
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[700px]">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 mb-4 border-b border-slate-100">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <div>
            <h2 className="font-extrabold text-sm text-slate-800">Admin CMS</h2>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">LinguaFlow Portal</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Admin Main Content View */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
