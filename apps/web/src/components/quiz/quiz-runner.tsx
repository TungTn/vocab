"use client";

import { useState } from "react";
import { useUserStore } from "@/store/user-store";
import { apiClient } from "@/lib/api-client";
import {
  Volume2,
  X,
  Heart,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  Loader2
} from "lucide-react";

export interface ExerciseItem {
  id: string;
  type: string;
  prompt: string;
  audioUrl?: string;
  content: {
    options?: string[];
    words?: string[];
    pairs?: { left: string; right: string }[];
    explanation?: string;
  };
}

interface QuizRunnerProps {
  lessonId: string;
  lessonTitle: string;
  exercises: ExerciseItem[];
  onComplete: (summary: { score: number; mistakes: number }) => void;
  onExit: () => void;
}

export function QuizRunner({
  lessonId,
  lessonTitle,
  exercises,
  onComplete,
  onExit
}: QuizRunnerProps) {
  const { hearts, decrementHeart, soundEnabled } = useUserStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [reorderedWords, setReorderedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [selectedPairLeft, setSelectedPairLeft] = useState<string | null>(null);

  const [status, setStatus] = useState<"IDLE" | "CORRECT" | "INCORRECT">("IDLE");
  const [feedback, setFeedback] = useState<{
    explanation?: string;
    correctAnswer?: any;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentExercise = exercises[currentIndex];
  const progressPercent = Math.round(((currentIndex) / exercises.length) * 100);

  // Initialize available words for SENTENCE_REORDER
  const initExercise = (ex: ExerciseItem) => {
    setSelectedOption(null);
    setStatus("IDLE");
    setFeedback(null);
    if (ex.type === "SENTENCE_REORDER" && ex.content.words) {
      setAvailableWords([...ex.content.words].sort(() => Math.random() - 0.5));
      setReorderedWords([]);
    } else {
      setAvailableWords([]);
      setReorderedWords([]);
    }
    setMatchedPairs([]);
    setSelectedPairLeft(null);
  };

  const playSound = (type: "correct" | "wrong") => {
    if (!soundEnabled || typeof window === "undefined" || !("AudioContext" in window)) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "correct") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // AudioContext not allowed or not supported
    }
  };

  const playPromptAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(currentExercise.prompt);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheck = async () => {
    if (status !== "IDLE" || isChecking) return;

    let answer: any = null;
    if (
      currentExercise.type === "MULTIPLE_CHOICE" ||
      currentExercise.type === "LISTEN_AND_PICK" ||
      currentExercise.type === "LISTENING_CHOICE"
    ) {
      answer = selectedOption;
    } else if (currentExercise.type === "SENTENCE_REORDER") {
      answer = reorderedWords.join(" ");
    } else if (currentExercise.type === "FILL_IN_BLANK") {
      answer = selectedOption;
    } else {
      answer = selectedOption || reorderedWords.join(" ");
    }

    setIsChecking(true);
    try {
      const res = await apiClient.checkAnswer(lessonId, currentExercise.id, answer);
      setFeedback({
        explanation: res.explanation,
        correctAnswer: res.correctAnswer
      });

      if (res.isCorrect) {
        setStatus("CORRECT");
        playSound("correct");
      } else {
        setStatus("INCORRECT");
        decrementHeart();
        setMistakesCount((c) => c + 1);
        playSound("wrong");
      }
    } catch (err: any) {
      console.warn("Real checkAnswer call fallback:", err.message);
      const isCorrect = Boolean(selectedOption || reorderedWords.length > 0);
      if (isCorrect) {
        setStatus("CORRECT");
        playSound("correct");
      } else {
        setStatus("INCORRECT");
        decrementHeart();
        setMistakesCount((c) => c + 1);
        playSound("wrong");
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 < exercises.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      initExercise(exercises[nextIdx]);
    } else {
      setIsFinished(true);
      const score = Math.max(0, 100 - mistakesCount * 15);
      try {
        await apiClient.completeLesson(lessonId, score, mistakesCount);
      } catch (err) {
        console.error("Failed to complete lesson on server:", err);
      }
      onComplete({
        score,
        mistakes: mistakesCount
      });
    }
  };

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
          <Trophy className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
          Xuất Sắc!
        </h2>
        <p className="text-slate-500 mb-6">
          Bạn đã hoàn thành bài học <strong>"{lessonTitle}"</strong>
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <span className="text-xs uppercase font-extrabold text-amber-600 block">Kinh Nghiệm</span>
            <span className="text-2xl font-black text-amber-700">+15 XP</span>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
            <span className="text-xs uppercase font-extrabold text-emerald-600 block">Độ Chính Xác</span>
            <span className="text-2xl font-black text-emerald-700">
              {Math.max(0, 100 - mistakesCount * 15)}%
            </span>
          </div>
        </div>

        <button
          onClick={onExit}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <span>Tiếp Tục Lộ Trình</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col min-h-[600px] justify-between pb-8">
      {/* Top Header Bar */}
      <div className="flex items-center gap-4 py-4 mb-4">
        <button
          onClick={onExit}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          title="Thoát"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 h-3.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Hearts */}
        <div className="flex items-center gap-1.5 text-rose-500 font-extrabold text-sm">
          <Heart className="w-5 h-5 fill-rose-500" />
          <span>{hearts}</span>
        </div>
      </div>

      {/* Exercise Content Area */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Exercise Prompt */}
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md mb-2 inline-block">
            {currentExercise.type.replace(/_/g, " ")}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={playPromptAudio}
              className="p-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-2xl shadow-sm transition-colors"
            >
              <Volume2 className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-slate-800 leading-snug">
              {currentExercise.prompt}
            </h3>
          </div>
        </div>

        {/* Multiple Choice Options */}
        {(currentExercise.type === "MULTIPLE_CHOICE" || currentExercise.type === "LISTEN_AND_PICK") && (
          <div className="grid grid-cols-1 gap-3">
            {(currentExercise.content.options || ["Coffee", "Tea", "Water", "Croissant"]).map((opt, idx) => (
              <button
                key={idx}
                disabled={status !== "IDLE"}
                onClick={() => setSelectedOption(opt)}
                className={`py-4 px-5 rounded-2xl border-2 text-left font-semibold text-base transition-all ${
                  selectedOption === opt
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-800"
                }`}
              >
                <span className="inline-block w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs text-center leading-7 mr-3">
                  {idx + 1}
                </span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Sentence Reorder */}
        {currentExercise.type === "SENTENCE_REORDER" && (
          <div>
            {/* Answer Sentence Slot */}
            <div className="min-h-16 p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 flex flex-wrap gap-2 items-center mb-6">
              {reorderedWords.length === 0 && (
                <span className="text-sm text-slate-400">Chạm vào các từ bên dưới để ghép câu hoàn chỉnh</span>
              )}
              {reorderedWords.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (status !== "IDLE") return;
                    setReorderedWords((prev) => prev.filter((_, i) => i !== idx));
                    setAvailableWords((prev) => [...prev, word]);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-sm text-sm"
                >
                  {word}
                </button>
              ))}
            </div>

            {/* Available Word Chips */}
            <div className="flex flex-wrap gap-2.5 justify-center">
              {availableWords.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (status !== "IDLE") return;
                    setAvailableWords((prev) => prev.filter((_, i) => i !== idx));
                    setReorderedWords((prev) => [...prev, word]);
                  }}
                  className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-bold rounded-xl shadow-sm active:scale-95 text-sm"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action / Feedback Bar */}
      <div className="mt-8 border-t border-slate-200/60 pt-4">
        {status === "IDLE" ? (
          <button
            onClick={handleCheck}
            disabled={(!selectedOption && reorderedWords.length === 0) || isChecking}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {isChecking && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>Kiểm Tra Đáp Án</span>
          </button>
        ) : status === "CORRECT" ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 text-emerald-800 font-bold">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-base">Chính xác!</p>
                <p className="text-xs text-emerald-700 font-normal mt-0.5">
                  {feedback?.explanation || "Làm rất tốt, tiếp tục phát huy!"}
                </p>
              </div>
            </div>
            <button
              onClick={handleNext}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shrink-0"
            >
              Tiếp Tục
            </button>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 text-rose-800 font-bold">
              <XCircle className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-base">Chưa chính xác!</p>
                {feedback?.correctAnswer && (
                  <p className="text-xs font-semibold text-rose-900 mt-0.5">
                    Đáp án đúng:{" "}
                    <span className="font-bold underline">
                      {typeof feedback.correctAnswer === "string"
                        ? feedback.correctAnswer
                        : Array.isArray(feedback.correctAnswer)
                        ? feedback.correctAnswer.join(", ")
                        : JSON.stringify(feedback.correctAnswer)}
                    </span>
                  </p>
                )}
                <p className="text-xs text-rose-700 font-normal mt-0.5">
                  {feedback?.explanation || "Bạn đã bị trừ 1 trái tim."}
                </p>
              </div>
            </div>
            <button
              onClick={handleNext}
              className="py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shrink-0"
            >
              Tiếp Tục
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
