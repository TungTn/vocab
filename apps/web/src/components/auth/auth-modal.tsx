"use client";

import { useState } from "react";
import { useUserStore } from "@/store/user-store";
import { apiClient } from "@/lib/api-client";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2
} from "lucide-react";

export function AuthModal() {
  const { authModalOpen, authModalTab, closeAuthModal, openAuthModal, loginUser } = useUserStore();

  const [tab, setTab] = useState<"login" | "register">(authModalTab || "login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Basic Validation
    if (!email || !password) {
      setError("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có độ dài tối thiểu 8 ký tự.");
      return;
    }

    if (tab === "register") {
      if (!username) {
        setError("Vui lòng nhập tên người dùng.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === "login") {
        const res = await apiClient.login(email.trim(), password);
        loginUser(res.user, res.accessToken);
        setSuccessMsg("Đăng nhập thành công!");
        setTimeout(() => closeAuthModal(), 500);
      } else {
        const res = await apiClient.register(email.trim(), username.trim(), password);
        loginUser(res.user, res.accessToken);
        setSuccessMsg("Tạo tài khoản thành công! Đang chuyển hướng...");
        setTimeout(() => closeAuthModal(), 500);
      }
    } catch (err: any) {
      setError(err.message || "Xác thực không thành công. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setError(null);
    setLoading(true);
    try {
      const mockOAuthData = {
        google: {
          email: "google.user@example.com",
          displayName: "Google Learner",
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleLearner"
        },
        facebook: {
          email: "facebook.user@example.com",
          displayName: "Facebook Learner",
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=FacebookLearner"
        }
      }[provider];

      const res = await apiClient.oauthLogin(
        provider,
        mockOAuthData.email,
        mockOAuthData.displayName,
        mockOAuthData.avatarUrl
      );
      loginUser(res.user, res.accessToken);
      setSuccessMsg(`Đăng nhập thành công với ${provider === "google" ? "Google" : "Facebook"}!`);
      setTimeout(() => closeAuthModal(), 500);
    } catch (err: any) {
      setError(err.message || `Đăng nhập với ${provider} thất bại.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all scale-100">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pt-8 pb-4 px-8 text-center bg-gradient-to-b from-emerald-50/70 to-white">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/20">
            LF
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {tab === "login" ? "Chào Mừng Trở Lại!" : "Bắt Đầu Học Ngay"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {tab === "login"
              ? "Đăng nhập để lưu chuỗi ngày học, bảng xếp hạng và mở khóa bài học."
              : "Tạo tài khoản LinguaFlow hoàn toàn miễn phí chỉ trong 30 giây."}
          </p>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mt-5">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                tab === "login"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                tab === "register"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Đăng Ký
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-8 pb-8 pt-3 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === "register" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên người dùng</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nguyenvana"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
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

            {tab === "register" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-md hover:shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{tab === "login" ? "Đăng Nhập" : "Đăng Ký Tài Khoản"}</span>
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Hoặc tiếp tục với
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleOAuthLogin("google")}
              disabled={loading}
              className="py-2 px-3 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin("facebook")}
              disabled={loading}
              className="py-2 px-3 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
