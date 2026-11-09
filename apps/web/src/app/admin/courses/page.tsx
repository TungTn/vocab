"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, BookOpen, Layers, CheckCircle, Eye, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLevel, setNewLevel] = useState("A1");
  const [creating, setCreating] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCourses();
      setCourses(data || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách khóa học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCode) return;

    setCreating(true);
    try {
      const created = await apiClient.adminCreateCourse({
        code: newCode,
        title: newTitle,
        description: newDescription || "Khóa học tiếng Anh trên LinguaFlow",
        level: newLevel
      });
      setCourses((prev) => [created, ...prev]);
      setShowModal(false);
      setNewTitle("");
      setNewCode("");
      setNewDescription("");
    } catch (err: any) {
      alert("Lỗi tạo khóa học: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Quản Lý Khóa Học & Lộ Trình</h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết kế cây bài học, các dạng câu hỏi trắc nghiệm, ghép từ và nghe hiểu.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Khóa Học</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 bg-white border border-slate-200 rounded-3xl h-44" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 bg-white border border-rose-200 rounded-3xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 mb-1">Không thể tải khóa học</p>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchCourses}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Thử lại
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">Chưa có khóa học nào</p>
          <p className="text-xs text-slate-400 mt-1">Nhấn "Thêm Khóa Học" để bắt đầu xây dựng giáo trình.</p>
        </div>
      ) : (
        /* Courses List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <div
              key={c.id}
              className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-black">
                    {c.level}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{c.code}</span>
                </div>
                <h3 className="font-extrabold text-base text-slate-800 mb-1">{c.title}</h3>
                <p className="text-xs text-slate-500">
                  {c.units?.length || c.unitsCount || 0} Units • {c.totalLessons || c.lessonsCount || 0} Bài học tương tác
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="text-emerald-600">Đang hoạt động</span>
                <button className="flex items-center gap-1 hover:text-slate-900">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem chi tiết Units</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Course */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-black text-lg text-slate-800">Tạo Khóa Học Mới</h3>
            <form onSubmit={handleAddCourse} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Mã khóa học (Code)</label>
                <input
                  type="text"
                  placeholder="en-b2"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-normal text-sm"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Tiêu đề khóa học</label>
                <input
                  type="text"
                  placeholder="Tiếng Anh Phỏng Vấn (B2)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-normal text-sm"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  placeholder="Mục tiêu đầu ra khóa học..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-normal text-sm"
                />
              </div>

              <div>
                <label className="block mb-1">Cấp độ CEFR</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-normal text-sm"
                >
                  <option value="A1">A1 - Căn bản</option>
                  <option value="A2">A2 - Sơ cấp</option>
                  <option value="B1">B1 - Trung cấp</option>
                  <option value="B2">B2 - Trung cao cấp</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu Khóa Học</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
