"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Card3D, FlashcardItem } from "@/components/flashcard/card-3d";
import { CardRating } from "@linguaflow/shared-types";
import { useUserStore } from "@/store/user-store";
import { Sparkles, Trophy, RotateCcw, AlertCircle, BookOpen } from "lucide-react";
import Link from "next/link";

export default function FlashcardsPage() {
  const [queue, setQueue] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const { addXp, openAuthModal } = useUserStore();

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getReviewQueue(undefined, 20);
      setQueue(data || []);
      setCurrentIndex(0);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách thẻ SRS.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleRating = async (rating: CardRating) => {
    const currentCard = queue[currentIndex];
    if (!currentCard) return;

    try {
      await apiClient.submitCardReview(currentCard.id, rating);
    } catch (err) {
      console.warn("Card review submission warning:", err);
    }

    addXp(5);
    setReviewedCount((c) => c + 1);

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setQueue([]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Đang tải thẻ ôn tập SRS...</p>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes("token") || error.includes("Unauthorized");
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl shadow-sm border border-slate-200 text-center">
        <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isAuthError ? "text-emerald-500" : "text-rose-500"}`} />
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          {isAuthError ? "Vui Lòng Đăng Nhập" : "Không Thể Tải Thẻ Ghi Nhớ"}
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          {isAuthError ? "Đăng nhập để xem danh sách thẻ ôn tập FSRS được cá nhân hóa cho bạn." : error}
        </p>
        <button
          onClick={() => (isAuthError ? openAuthModal("login") : fetchQueue())}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 mx-auto transition-all"
        >
          {isAuthError ? <span>Đăng Nhập Ngay</span> : (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>Thử Tải Lại</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (queue.length === 0 && reviewedCount === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl shadow-sm border border-slate-200 text-center animate-in fade-in">
        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Không Có Thẻ Cần Ôn Hôm Nay!</h2>
        <p className="text-slate-500 text-xs mb-6">
          Toàn bộ từ vựng của bạn đã được ôn tập đúng hạn theo thuật toán FSRS v4. Hãy học thêm bài mới để bổ sung từ vào kho lưu trữ!
        </p>
        <Link
          href="/learn"
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          <span>Học Thêm Bài Mới</span>
        </Link>
      </div>
    );
  }

  if (queue.length === 0 || currentIndex >= queue.length) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
          <Trophy className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
          Tuyệt Vời! Đã Hoàn Thành Ôn Tập
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Bạn đã hoàn thành <strong>{reviewedCount}</strong> thẻ ghi nhớ trong phiên hôm nay. Thuật toán FSRS đã tối ưu hóa lịch hẹn cho bạn!
        </p>
        <button
          onClick={fetchQueue}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Ôn Thêm Từ Mới</span>
        </button>
      </div>
    );
  }

  const currentCard = queue[currentIndex];

  return (
    <div className="max-w-xl mx-auto py-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">
          Ôn Tập Thông Minh (FSRS v4)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Lặp lại ngắt quãng khoa học giúp lưu trữ từ vựng vào trí nhớ dài hạn.
        </p>
      </div>

      <Card3D
        card={currentCard}
        onRating={handleRating}
        queueRemaining={queue.length - currentIndex}
      />
    </div>
  );
}
