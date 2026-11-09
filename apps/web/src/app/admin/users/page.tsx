"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Users, Shield, Heart, Gem, Trophy, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.adminGetUsers(1, 50);
      setUsers(res.users || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách học viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiClient.adminUpdateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      alert("Lỗi cập nhật vai trò: " + err.message);
    }
  };

  const handleRefillHearts = async (userId: string) => {
    try {
      await apiClient.adminRefillUserHearts(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, hearts: 5 } : u))
      );
      alert("Đã hồi phục 5 tim cho người dùng!");
    } catch (err: any) {
      alert("Lỗi hồi tim: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Quản Lý Học Viên & Quyền Hạn</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cấp quyền Giáo viên/Admin, xem tiến trình học và hỗ trợ hồi phục tài nguyên.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 bg-white border border-rose-200 rounded-3xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 mb-1">Không thể tải danh sách học viên</p>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Thử lại
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">Chưa có người dùng nào</p>
          <p className="text-xs text-slate-400 mt-1">Học viên mới đăng ký sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 text-xs">
            {users.map((u) => (
              <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <strong className="text-sm font-bold text-slate-800">{u.username || "Chưa đặt tên"}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === "ADMIN" ? "bg-purple-100 text-purple-800" : u.role === "TEACHER" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-slate-400">{u.email}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] font-semibold text-slate-600">
                    <span>🔥 {u.streak || 0} ngày</span>
                    <span>❤️ {u.hearts ?? 5}/5 tim</span>
                    <span>💎 {u.gems ?? 0} gems</span>
                    <span>🏆 {u.league || "BRONZE"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="p-2 rounded-xl border border-slate-200 font-bold text-xs"
                  >
                    <option value="USER">Học viên</option>
                    <option value="TEACHER">Giáo viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>

                  <button
                    onClick={() => handleRefillHearts(u.id)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-colors"
                    title="Hồi phục 5 tim"
                  >
                    Hồi 5 Tim
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
