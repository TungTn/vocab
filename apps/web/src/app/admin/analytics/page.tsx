"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { AlertCircle, Flame, TrendingDown, Users, RefreshCw, Loader2 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [dropoffs, setDropoffs] = useState<any[]>([]);
  const [strugglingWords, setStrugglingWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dropRes, wordsRes] = await Promise.allSettled([
        apiClient.getExerciseDropOff(),
        apiClient.getStrugglingWords()
      ]);

      if (dropRes.status === "fulfilled") {
        setDropoffs(dropRes.value || []);
      }
      if (wordsRes.status === "fulfilled") {
        setStrugglingWords(wordsRes.value || []);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải báo cáo phân tích học tập.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Thống Kê Học Tập & Điểm Rơi (Drop-off)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Xác định những bài tập và từ vựng có tỷ lệ làm sai cao nhất để giáo viên tối ưu giáo trình.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-48 bg-white border border-slate-200 rounded-3xl" />
          <div className="h-48 bg-white border border-slate-200 rounded-3xl" />
        </div>
      ) : error ? (
        <div className="p-8 bg-white border border-rose-200 rounded-3xl text-center max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 mb-1">Không thể tải dữ liệu phân tích</p>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {/* Heatmap Section */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <h3 className="font-extrabold text-base text-slate-800">
                Heatmap: Top Bài Tập Có Tỷ Lệ Làm Sai Cao Nhất
              </h3>
            </div>

            {dropoffs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Chưa ghi nhận dữ liệu bài tập nào có tỷ lệ làm sai vượt ngưỡng cảnh báo.
              </p>
            ) : (
              <div className="space-y-3">
                {dropoffs.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{item.unitTitle || "Unit chung"}</span>
                      <strong className="text-sm font-bold text-slate-800">{item.lessonTitle || item.prompt}</strong>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {item.totalAttempts} lượt làm • {item.totalMistakes} lần mắc lỗi
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-base font-black ${
                        item.errorRate > 40 ? "text-rose-600" : "text-amber-600"
                      }`}>
                        {item.errorRate}%
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block">Tỷ lệ sai</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Struggling Vocabulary Section */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-800">
                Từ Vựng Khó Nhớ (High Lapses SRS)
              </h3>
            </div>

            {strugglingWords.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Toàn bộ từ vựng hiện tại đều có độ ổn định trí nhớ (stability) tốt.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {strugglingWords.map((w, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <strong className="text-sm font-bold text-slate-800">{w.term}</strong>
                      <span className="text-xs text-slate-500 block">Độ khó: {w.difficulty}/10</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-rose-600 block">{w.lapses} quên</span>
                      <span className="text-[10px] text-slate-400 font-bold">Stability: {w.stability}d</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
