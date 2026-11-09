"use client";

import { useState, useEffect } from "react";
import { CardRating } from "@linguaflow/shared-types";
import { Volume2, RotateCcw, Check, Sparkles } from "lucide-react";

export interface FlashcardItem {
  id: string;
  term: string;
  ipa?: string;
  meaning: string;
  pos?: string;
  examples?: { text: string; translation: string }[];
  audioUrl?: string;
  stability?: number;
  difficulty?: number;
}

interface Card3DProps {
  card: FlashcardItem;
  onRating: (rating: CardRating) => void;
  queueRemaining: number;
}

export function Card3D({ card, onRating, queueRemaining }: Card3DProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [card.id]);

  // Keyboard shortcut listener: Space to flip, 1-4 to rate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") onRating(CardRating.AGAIN);
        else if (e.key === "2") onRating(CardRating.HARD);
        else if (e.key === "3") onRating(CardRating.GOOD);
        else if (e.key === "4") onRating(CardRating.EASY);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, onRating]);

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(card.term);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Remaining count pill */}
      <div className="flex items-center justify-between w-full mb-3 text-xs font-semibold text-slate-500">
        <span>Còn lại: <strong className="text-emerald-600">{queueRemaining}</strong> thẻ cần ôn</span>
        <span>Phím tắt: Space (Lật), 1-4 (Đánh giá)</span>
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full h-80 perspective-1000 cursor-pointer select-none"
      >
        <div
          className={`relative w-full h-full rounded-2xl shadow-xl transition-transform duration-500 transform-style-preserve-3d border border-slate-200/80 ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Card Front */}
          <div className="absolute inset-0 w-full h-full bg-white rounded-2xl p-8 flex flex-col justify-between backface-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md">
                Tiếng Anh
              </span>
              <button
                onClick={playAudio}
                className="p-2.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 rounded-full transition-colors"
                title="Nghe phát âm"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center my-auto">
              <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
                {card.term}
              </h2>
              {card.ipa && (
                <p className="text-slate-500 font-mono text-sm tracking-wide">
                  {card.ipa}
                </p>
              )}
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              Chạm hoặc bấm [Phím Cách] để xem nghĩa
            </div>
          </div>

          {/* Card Back */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-8 flex flex-col justify-between backface-hidden rotate-y-180 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-1 bg-emerald-600 text-white rounded-md">
                Nghĩa & Ví Dụ
              </span>
              <button
                onClick={playAudio}
                className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-full transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center my-auto">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {card.meaning}
              </h3>

              {card.examples && card.examples.length > 0 && (
                <div className="bg-white/80 rounded-xl p-3 border border-emerald-100 text-left text-sm">
                  <p className="text-slate-800 font-medium italic mb-1">
                    "{card.examples[0].text}"
                  </p>
                  <p className="text-slate-500 text-xs">
                    {card.examples[0].translation}
                  </p>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              Chọn mức độ ghi nhớ bên dưới
            </div>
          </div>
        </div>
      </div>

      {/* FSRS Rating Buttons Bar */}
      <div className="w-full grid grid-cols-4 gap-2 mt-6">
        <button
          onClick={() => onRating(CardRating.AGAIN)}
          className="flex flex-col items-center justify-center py-2.5 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-700 font-bold transition-all active:scale-95"
        >
          <span className="text-xs uppercase tracking-wider text-rose-500 font-extrabold mb-0.5">
            1. Quên
          </span>
          <span className="text-sm">Again</span>
          <span className="text-[10px] text-rose-400 font-normal">&lt; 10m</span>
        </button>

        <button
          onClick={() => onRating(CardRating.HARD)}
          className="flex flex-col items-center justify-center py-2.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-amber-700 font-bold transition-all active:scale-95"
        >
          <span className="text-xs uppercase tracking-wider text-amber-500 font-extrabold mb-0.5">
            2. Khó
          </span>
          <span className="text-sm">Hard</span>
          <span className="text-[10px] text-amber-500 font-normal">1 ngày</span>
        </button>

        <button
          onClick={() => onRating(CardRating.GOOD)}
          className="flex flex-col items-center justify-center py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-700 font-bold transition-all active:scale-95"
        >
          <span className="text-xs uppercase tracking-wider text-emerald-600 font-extrabold mb-0.5">
            3. Nhớ
          </span>
          <span className="text-sm">Good</span>
          <span className="text-[10px] text-emerald-600 font-normal">3 ngày</span>
        </button>

        <button
          onClick={() => onRating(CardRating.EASY)}
          className="flex flex-col items-center justify-center py-2.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-700 font-bold transition-all active:scale-95"
        >
          <span className="text-xs uppercase tracking-wider text-blue-500 font-extrabold mb-0.5">
            4. Dễ
          </span>
          <span className="text-sm">Easy</span>
          <span className="text-[10px] text-blue-400 font-normal">7 ngày</span>
        </button>
      </div>
    </div>
  );
}
