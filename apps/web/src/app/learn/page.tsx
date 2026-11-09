"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { useUserStore } from "@/store/user-store";
import { Check, Star, Lock, BookOpen, Sparkles, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

export default function LearnPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{ id: string; title: string } | null>(null);
  const [lessonSession, setLessonSession] = useState<any | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const { addXp, openAuthModal } = useUserStore();

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCourses();
      setCourses(data || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách khóa học. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleStartLesson = async (lesson: { id: string; title: string }) => {
    if (!apiClient.getToken()) {
      openAuthModal("login");
      return;
    }

    setSelectedLesson(lesson);
    setSessionLoading(true);
    setSessionError(null);
    try {
      const session = await apiClient.getLessonSession(lesson.id);
      setLessonSession(session);
    } catch (err: any) {
      setSessionError(err.message || "Không thể tải nội dung bài học từ máy chủ.");
    } finally {
      setSessionLoading(false);
    }
  };

  if (selectedLesson && sessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-600">Đang khởi tạo bài học "{selectedLesson.title}"...</p>
      </div>
    );
  }

  if (selectedLesson && sessionError) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl shadow-xl border border-rose-200 text-center animate-in fade-in">
        <div className="w-16 h-16 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Không Thể Tải Bài Học</h2>
        <p className="text-slate-500 text-xs mb-6">{sessionError}</p>
        <button
          onClick={() => {
            setSelectedLesson(null);
            setSessionError(null);
          }}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all"
        >
          Quay Lại Lộ Trình
        </button>
      </div>
    );
  }

  if (selectedLesson && lessonSession) {
    return (
      <QuizRunner
        lessonId={selectedLesson.id}
        lessonTitle={selectedLesson.title}
        exercises={lessonSession.exercises || []}
        onComplete={(summary) => {
          addXp(15);
        }}
        onExit={() => {
          setSelectedLesson(null);
          setLessonSession(null);
          fetchCourses(); // refresh progress
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="h-16 bg-slate-200 rounded-2xl" />
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="w-20 h-20 bg-slate-200 rounded-full" />
          <div className="w-20 h-20 bg-slate-200 rounded-full translate-x-12" />
          <div className="w-20 h-20 bg-slate-200 rounded-full -translate-x-12" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl shadow-sm border border-rose-200 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">Lỗi Kết Nối Máy Chủ</h3>
        <p className="text-xs text-slate-500 mb-6">{error}</p>
        <button
          onClick={fetchCourses}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 mx-auto transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Thử Tải Lại</span>
        </button>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl shadow-sm border border-slate-200 text-center">
        <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">Chưa Có Khóa Học Nào</h3>
        <p className="text-xs text-slate-500 mb-6">
          Hệ thống hiện tại chưa có khóa học nào được phát hành. Vui lòng quay lại sau hoặc liên hệ quản trị viên.
        </p>
        <button
          onClick={fetchCourses}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Làm Mới</span>
        </button>
      </div>
    );
  }

  const currentCourse = courses[0];

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Course Header Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl text-white shadow-lg mb-8 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-100 bg-white/20 px-3 py-1 rounded-full">
            {currentCourse?.level || "A1"} Căn Bản
          </span>
          <h1 className="text-2xl font-black mt-2">
            {currentCourse?.title || "Tiếng Anh Giao Tiếp Căn Bản"}
          </h1>
          <p className="text-sm text-emerald-100 mt-1">
            {currentCourse?.description || "Lộ trình học phản xạ và từ vựng cốt lõi."}
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
          🎯
        </div>
      </div>

      {/* Units & Lesson Tree */}
      <div className="space-y-10">
        {(currentCourse?.units || []).map((unit: any, uIdx: number) => (
          <div key={unit.id || uIdx} className="relative">
            {/* Unit Header Title */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-800">{unit.title}</h3>
                <p className="text-xs text-slate-500">{unit.lessons?.length || 0} bài học tương tác</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Unit {uIdx + 1}
              </span>
            </div>

            {/* Circular Lesson Nodes */}
            <div className="flex flex-col items-center gap-6 py-2">
              {(unit.lessons || []).map((lesson: any, lIdx: number) => {
                const isCompleted = lesson.completed || (uIdx === 0 && lIdx === 0);
                const isActive = uIdx === 0 && lIdx <= 1;
                const isLocked = !isActive && !isCompleted;

                // Subtle zigzag path positioning
                const offsetClass =
                  lIdx % 3 === 1
                    ? "translate-x-12"
                    : lIdx % 3 === 2
                    ? "-translate-x-12"
                    : "translate-x-0";

                return (
                  <div key={lesson.id} className={`flex flex-col items-center ${offsetClass}`}>
                    <button
                      onClick={() => !isLocked && handleStartLesson(lesson)}
                      disabled={isLocked}
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center font-extrabold text-white text-xl shadow-lg transition-transform active:scale-95 ${
                        isCompleted
                          ? "bg-amber-400 border-4 border-amber-300 ring-4 ring-amber-100"
                          : isActive
                          ? "bg-emerald-500 border-4 border-emerald-400 ring-4 ring-emerald-100 animate-pulse"
                          : "bg-slate-300 border-4 border-slate-200 cursor-not-allowed"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-9 h-9 stroke-[3]" />
                      ) : isActive ? (
                        <Star className="w-9 h-9 fill-white" />
                      ) : (
                        <Lock className="w-8 h-8 text-slate-400" />
                      )}
                    </button>
                    <span className="text-xs font-bold text-slate-700 mt-2 text-center max-w-[120px]">
                      {lesson.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
