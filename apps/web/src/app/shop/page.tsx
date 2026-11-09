"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useUserStore } from "@/store/user-store";
import { Gem, ShoppingBag, Heart, Shield, Zap, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function ShopPage() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { gems, refillHearts, deductGems, openAuthModal } = useUserStore();
  const [message, setMessage] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getShopCatalog();
      setCatalog(data || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh mục cửa hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleBuy = async (item: any) => {
    if (!apiClient.getToken()) {
      openAuthModal("login");
      return;
    }
    if (gems < item.costGems) {
      setMessage(`Không đủ Gems! Bạn cần thêm ${item.costGems - gems} 💎.`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      await apiClient.buyShopItem(item.id);
      deductGems(item.costGems);
      if (item.id === "HEART_REFILL") {
        refillHearts();
      }
      setMessage(`Đã mua thành công ${item.name}!`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage(`Giao dịch thất bại: ${err.message || "Lỗi máy chủ"}`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Banner */}
      <div className="p-6 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl text-white shadow-lg mb-8 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-100 bg-white/20 px-3 py-1 rounded-full">
            Cửa Hàng Vật Phẩm
          </span>
          <h1 className="text-2xl font-black mt-2">Kinh Tế Ảo & Tiếp Sức Học</h1>
          <p className="text-sm text-cyan-100 mt-1">
            Dùng số Gems tích lũy từ chuỗi streak và bài học để nâng cấp trải nghiệm.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-2xl border border-white/30 backdrop-blur-sm">
          <Gem className="w-5 h-5 fill-cyan-300 text-cyan-300" />
          <span className="text-xl font-black">{gems}</span>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 bg-white border border-slate-200 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-slate-200 rounded" />
                  <div className="w-48 h-3 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="w-16 h-8 bg-slate-200 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto my-8 p-8 bg-white rounded-3xl shadow-sm border border-rose-200 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Lỗi Kết Nối Cửa Hàng</h3>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchCatalog}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử Lại</span>
          </button>
        </div>
      ) : catalog.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 mb-1">Cửa Hàng Trống</h3>
          <p className="text-xs text-slate-400">
            Hiện tại các vật phẩm đang được cập nhật thêm. Vui lòng quay lại sau!
          </p>
        </div>
      ) : (
        /* Catalog Grid */
        <div className="space-y-4">
          {catalog.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl">
                  {item.icon || "🎁"}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">{item.name}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-0.5">{item.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleBuy(item)}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap"
              >
                <span>{item.costGems}</span>
                <Gem className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
