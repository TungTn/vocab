"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { LeagueTier } from "@linguaflow/shared-types";
import { Trophy, ArrowUp, ArrowDown, Minus, Crown, AlertCircle, RefreshCw } from "lucide-react";

export default function LeaderboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<LeagueTier>(LeagueTier.SILVER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tiers = [
    { tier: LeagueTier.BRONZE, name: "Đồng" },
    { tier: LeagueTier.SILVER, name: "Bạc" },
    { tier: LeagueTier.GOLD, name: "Vàng" },
    { tier: LeagueTier.SAPPHIRE, name: "Lam Ngọc" },
    { tier: LeagueTier.RUBY, name: "Hồng Ngọc" },
    { tier: LeagueTier.DIAMOND, name: "Kim Cương" }
  ];

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getLeaderboard(selectedLeague);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Không thể tải bảng xếp hạng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedLeague]);

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
          <Trophy className="w-7 h-7 text-amber-500" />
          <span>Bảng Xếp Hạng Hàng Tuần</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Top 7 thăng hạng lên giải đấu cao hơn. 5 người cuối rớt hạng.
        </p>
      </div>

      {/* League Tier Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-6 no-scrollbar justify-center">
        {tiers.map((t) => (
          <button
            key={t.tier}
            onClick={() => setSelectedLeague(t.tier)}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
              selectedLeague === t.tier
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Member List or Loading / Empty States */}
      {loading ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full" />
                <div className="w-10 h-10 bg-slate-200 rounded-full" />
                <div className="space-y-1.5">
                  <div className="w-24 h-4 bg-slate-200 rounded" />
                  <div className="w-16 h-3 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="w-12 h-4 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto my-8 p-8 bg-white rounded-3xl shadow-sm border border-rose-200 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Không Thể Tải Bảng Xếp Hạng</h3>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử Lại</span>
          </button>
        </div>
      ) : (!data?.members || data.members.length === 0) ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 mb-1">Chưa Có Dữ Liệu Bảng Đấu</h3>
          <p className="text-xs text-slate-400">
            Chưa có người học nào trong giải đấu này tuần này. Hãy hoàn thành một bài học để ghi tên lên bảng vàng!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {(data?.members || []).map((m: any) => {
            const isTop3 = m.rank <= 3;
            const isPromote = m.zone === "PROMOTE";
            const isDemote = m.zone === "DEMOTE";

            return (
              <div
                key={m.userId}
                className={`flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 ${
                  m.userId === "u-me" ? "bg-emerald-50/70" : "hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Number & Icon */}
                  <div className="w-8 flex items-center justify-center font-black text-sm">
                    {m.rank === 1 ? (
                      <Crown className="w-5 h-5 text-amber-500" />
                    ) : (
                      <span className={isTop3 ? "text-amber-600" : "text-slate-400"}>
                        {m.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <img
                    src={m.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=user"}
                    alt={m.username}
                    className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50"
                  />

                  {/* Username */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 leading-snug">
                      {m.username}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      {isPromote ? (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <ArrowUp className="w-3 h-3" /> Thăng hạng
                        </span>
                      ) : isDemote ? (
                        <span className="text-rose-500 flex items-center gap-0.5">
                          <ArrowDown className="w-3 h-3" /> Rớt hạng
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-0.5">
                          <Minus className="w-3 h-3" /> Trụ hạng
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* XP */}
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-800 block">
                    {m.xp} XP
                  </span>
                  {isTop3 && (
                    <span className="text-[10px] font-bold text-amber-600">
                      +{m.rank === 1 ? 100 : m.rank === 2 ? 50 : 25} 💎
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
