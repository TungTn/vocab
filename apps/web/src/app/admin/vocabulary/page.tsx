"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Upload, FileText, CheckCircle2, Sparkles, Volume2, AlertCircle, Loader2 } from "lucide-react";

export default function AdminVocabularyPage() {
  const [csvText, setCsvText] = useState(
    `cappuccino, Cà phê cappuccino bọt sữa, noun, Could I have a large cappuccino please?, Cho tôi một ly cappuccino lớn nhé?
croissant, Bánh sừng bò, noun, A hot croissant for breakfast., Một chiếc bánh sừng bò nóng cho bữa sáng.
reservation, Sự đặt chỗ trước, noun, I have a hotel reservation under John., Tôi có đặt phòng khách sạn dưới tên John.`
  );

  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [parsedCards, setParsedCards] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const list = await apiClient.getDecks();
        setDecks(list || []);
        if (list && list.length > 0) {
          setSelectedDeckId(list[0].id);
        }
      } catch (err) {
        console.warn("Could not fetch decks list:", err);
      }
    };
    fetchDecks();
  }, []);

  const handleParse = () => {
    const lines = csvText.trim().split("\n");
    const cards = lines.map((line, idx) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        id: `preview-${idx}`,
        term: parts[0] || "",
        meaning: parts[1] || "",
        pos: parts[2] || "noun",
        exampleText: parts[3] || "",
        exampleTranslation: parts[4] || ""
      };
    }).filter((c) => c.term.length > 0);

    setParsedCards(cards);
    setSuccessCount(null);
    setError(null);
  };

  const handleImport = async () => {
    if (parsedCards.length === 0) return;

    setImporting(true);
    setError(null);
    try {
      const targetDeckId = selectedDeckId || "deck-default";
      const res = await apiClient.adminBulkImportCards(
        targetDeckId,
        parsedCards.map((c) => ({
          term: c.term,
          meaning: c.meaning,
          pos: c.pos,
          exampleText: c.exampleText,
          exampleTranslation: c.exampleTranslation
        }))
      );
      setSuccessCount(res?.importedCount || parsedCards.length);
    } catch (err: any) {
      setError(err.message || "Lỗi khi nhập từ vựng vào hệ thống.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Nhập Từ Vựng Hàng Loạt (Bulk Import)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống sẽ tự động tra cứu phiên âm quốc tế IPA và tạo liên kết âm thanh phát âm chuẩn qua TTS.
        </p>
      </div>

      {/* CSV Input Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
        {decks.length > 0 && (
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Chọn Bộ Thẻ (Deck)</label>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 font-semibold text-xs bg-slate-50"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.cardsCount || 0} thẻ)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Định dạng CSV: Từ vựng, Nghĩa tiếng Việt, Từ loại, Câu ví dụ, Dịch ví dụ
          </label>
          <button
            onClick={handleParse}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            Phân Tích Dữ Liệu
          </button>
        </div>

        <textarea
          rows={6}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
          placeholder="term, meaning, pos, exampleText, exampleTranslation"
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            {parsedCards.length > 0 ? `Đã nhận dạng ${parsedCards.length} từ vựng` : "Bấm 'Phân Tích Dữ Liệu' để xem trước"}
          </span>
          <button
            onClick={handleImport}
            disabled={parsedCards.length === 0 || importing}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
          >
            {importing && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{importing ? "Đang xử lý IPA & Audio..." : "Nhập Vào Kho Từ Điển"}</span>
          </button>
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notification */}
      {successCount !== null && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Thành công! Đã thêm {successCount} thẻ flashcard vào kho từ vựng kèm phiên âm IPA và audio phát âm.</span>
        </div>
      )}

      {/* Preview Table */}
      {parsedCards.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 font-bold text-xs text-slate-700">
            Xem Trước Dữ Liệu Chuẩn Bị Nhập
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {parsedCards.map((c, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-slate-800">{c.term}</strong>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                      {c.pos}
                    </span>
                  </div>
                  <p className="text-slate-600">{c.meaning}</p>
                  {c.exampleText && (
                    <p className="text-slate-400 italic">"{c.exampleText}" - {c.exampleTranslation}</p>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  Auto IPA & TTS
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
