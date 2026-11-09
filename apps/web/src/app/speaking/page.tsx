"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useUserStore } from "@/store/user-store";
import { AiSpeakingChat } from "@/components/speaking/ai-speaking-chat";
import { Mic, Sparkles, MessageSquare, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";

export default function SpeakingPage() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openAuthModal } = useUserStore();

  const fetchScenarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getSpeakingScenarios();
      setScenarios(data || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách kịch bản nói.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  if (selectedScenario) {
    return (
      <div className="py-2">
        <AiSpeakingChat
          scenario={selectedScenario}
          onBack={() => setSelectedScenario(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Page Title Banner */}
      <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl text-white shadow-lg mb-8 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-teal-100 bg-white/20 px-3 py-1 rounded-full">
            AI Speaking Partner
          </span>
          <h1 className="text-2xl font-black mt-2">
            Luyện Giao Tiếp Phản Xạ & Sửa Phát Âm AI
          </h1>
          <p className="text-sm text-teal-100 mt-1 max-w-xl">
            Trò chuyện trực tiếp cùng trợ lý AI bản xứ trong các tình huống thực tế, nhận chấm điểm phát âm ngữ âm IPA và sửa lỗi câu tự nhiên.
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
          🎙️
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-20 h-5 bg-slate-200 rounded-lg" />
                <div className="w-10 h-10 bg-slate-200 rounded-full" />
              </div>
              <div className="w-40 h-5 bg-slate-200 rounded" />
              <div className="w-full h-12 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto my-8 p-8 bg-white rounded-3xl shadow-sm border border-rose-200 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Lỗi Tải Kịch Bản Nói</h3>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchScenarios}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử Lại</span>
          </button>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 mb-1">Chưa Có Kịch Bản Nói Nào</h3>
          <p className="text-xs text-slate-400">
            Hệ thống đang chuẩn bị thêm các tình huống hội thoại bản xứ. Hãy quay lại sau!
          </p>
        </div>
      ) : (
        /* Scenarios Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              onClick={() => {
                if (!apiClient.getToken()) {
                  openAuthModal("login");
                  return;
                }
                setSelectedScenario(sc);
              }}
              className="p-6 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-emerald-300 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                    {sc.level} • {sc.topic}
                  </span>
                  <img
                    src={sc.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=partner"}
                    alt={sc.title}
                    className="w-10 h-10 rounded-full border border-slate-200"
                  />
                </div>

                <h3 className="font-extrabold text-lg text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">
                  {sc.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {sc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>Bắt đầu hội thoại</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
