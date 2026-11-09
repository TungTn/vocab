"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Users, BookOpen, Layers, Target, Activity, AlertCircle, RefreshCw } from "lucide-react";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getAnalyticsOverview();
      setStats(res);
    } catch (err: any) {
      setError(err.message || "Không thể tải số liệu thống kê hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="w-48 h-8 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 bg-white border border-slate-200 rounded-3xl h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-white border border-rose-200 rounded-3xl text-center max-w-md mx-auto my-8">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-800 mb-1">Lỗi Kết Nối Analytics</p>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 mx-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Bảng Điều Khiển Hệ Thống</h1>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi các chỉ số hoạt động thời gian thực của toàn bộ nền tảng LinguaFlow.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Học Viên</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-3xl font-black text-slate-800">
            {(stats?.totalUsers ?? 0).toLocaleString()}
          </span>
          <span className="text-xs text-emerald-600 font-bold block mt-1">Tổng tài khoản đã đăng ký</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Học Viên Đang Học (DAU)</span>
            <Activity className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-3xl font-black text-slate-800">
            {(stats?.activeUsers ?? 0).toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-medium block mt-1">Hoạt động trong 24 giờ qua</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bài Học Hoàn Thành</span>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-3xl font-black text-slate-800">
            {(stats?.totalCompletedLessons ?? 0).toLocaleString()}
          </span>
          <span className="text-xs text-blue-600 font-bold block mt-1">
            Độ chính xác TB: {stats?.averageAccuracy ?? 0}%
          </span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lượt Ôn Tập FSRS</span>
            <Layers className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-3xl font-black text-slate-800">
            {(stats?.totalReviews ?? 0).toLocaleString()}
          </span>
          <span className="text-xs text-purple-600 font-bold block mt-1">Lặp lại ngắt quãng dài hạn</span>
        </div>
      </div>
    </div>
  );
}
