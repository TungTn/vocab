"use client";

import { useState } from "react";
import { useUserStore } from "@/store/user-store";
import { apiClient } from "@/lib/api-client";
import {
  X,
  User,
  Shield,
  Key,
  Flame,
  Heart,
  Gem,
  Trophy,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

export function ProfileModal() {
  const {
    profileModalOpen,
    closeProfileModal,
    username,
    email,
    role,
    avatarUrl,
    streak,
    hearts,
    gems,
    xp,
    league
  } = useUserStore();

  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!profileModalOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!currentPassword || !newPassword) {
      setError("Vui lòng điền mật khẩu hiện tại và mật khẩu mới.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.changePassword(currentPassword, newPassword);
      setSuccessMsg(res.message || "Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={closeProfileModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pt-8 pb-4 px-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-white text-2xl font-black shadow-md overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
              ) : (
                username.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">{username}</h2>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full uppercase">
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-500">{email}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => {
                setActiveTab("info");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "info"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Hồ Sơ & Thành Tích</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("password");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "password"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Đổi Mật Khẩu</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === "info" ? (
            <div className="space-y-6">
              {/* Gamification Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-xl">
                    <Flame className="w-5 h-5 text-amber-600 fill-amber-500" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-amber-900">{streak} ngày</div>
                    <div className="text-[11px] font-semibold text-amber-700">Chuỗi học tập</div>
                  </div>
                </div>

                <div className="p-4 bg-cyan-50/70 border border-cyan-200/60 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-100 rounded-xl">
                    <Gem className="w-5 h-5 text-cyan-600 fill-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-cyan-900">{gems}</div>
                    <div className="text-[11px] font-semibold text-cyan-700">Đá quý sở hữu</div>
                  </div>
                </div>

                <div className="p-4 bg-rose-50/70 border border-rose-200/60 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 rounded-xl">
                    <Heart className="w-5 h-5 text-rose-600 fill-rose-500" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-rose-900">{hearts}/5</div>
                    <div className="text-[11px] font-semibold text-rose-700">Số Tim hiện tại</div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/70 border border-indigo-200/60 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 rounded-xl">
                    <Trophy className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-indigo-900">{xp} XP</div>
                    <div className="text-[11px] font-semibold text-indigo-700">Hạng {league}</div>
                  </div>
                </div>
              </div>

              {/* Security Status Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Trạng thái bảo mật</div>
                    <div className="text-[11px] text-slate-500">Mã hóa mật khẩu Argon2id & JWT Refresh Token</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg">
                  BẢO VỆ
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Cập Nhật Mật Khẩu</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
