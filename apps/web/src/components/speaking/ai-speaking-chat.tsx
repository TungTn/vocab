"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, Volume2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { SpeakingTurnMessage, PronunciationAssessmentResult } from "@linguaflow/shared-types";

interface AiSpeakingChatProps {
  scenario: {
    id: string;
    title: string;
    description: string;
    level: string;
    topic: string;
    avatarUrl?: string;
    initialMessage: string;
    suggestedPhrases?: string[];
  };
  onBack: () => void;
}

export function AiSpeakingChat({ scenario, onBack }: AiSpeakingChatProps) {
  const [messages, setMessages] = useState<SpeakingTurnMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize session
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await apiClient.startSpeakingSession(scenario.id);
        setSessionId(res.id);
        if (res.transcript && res.transcript.length > 0) {
          setMessages(res.transcript);
        } else {
          setMessages([
            {
              id: "msg-0",
              role: "assistant",
              text: scenario.initialMessage,
              timestamp: new Date().toISOString()
            }
          ]);
        }
      } catch {
        setMessages([
          {
            id: "msg-0",
            role: "assistant",
            text: scenario.initialMessage,
            timestamp: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [scenario.id, scenario.initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    setInputText("");
    setLoading(true);

    const userTempMessage: SpeakingTurnMessage = {
      id: `msg-${Date.now()}-temp`,
      role: "user",
      text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userTempMessage]);

    try {
      if (!sessionId) {
        throw new Error("Chưa kết nối được với phòng luyện nói AI. Vui lòng tải lại.");
      }
      const res = await apiClient.submitSpeakingTurn(sessionId, text);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        res.userMessage,
        res.assistantMessage
      ]);
      playSpeech(res.assistantMessage.text);
    } catch (err: any) {
      console.error("Speaking turn error:", err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          text: `[Lỗi máy chủ: ${err.message || "Không thể nhận phản hồi từ AI Partner"}]`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const playSpeech = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      if (!isRecording) {
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.lang = "en-US";
          recognition.continuous = false;
          recognition.interimResults = false;

          recognition.onresult = (event: any) => {
            const transcript = event.results[0]?.[0]?.transcript;
            if (transcript) {
              setInputText(transcript);
            }
            setIsRecording(false);
          };

          recognition.onerror = () => {
            setIsRecording(false);
          };

          recognition.onend = () => {
            setIsRecording(false);
          };

          recognitionRef.current = recognition;
          recognition.start();
          setIsRecording(true);
        } catch {
          setIsRecording(false);
        }
      } else {
        recognitionRef.current?.stop();
        setIsRecording(false);
      }
    } else {
      // Fallback for browsers without Web Speech recognition
      if (!isRecording) {
        setIsRecording(true);
        setTimeout(() => {
          setIsRecording(false);
          const sample =
            scenario.suggestedPhrases && scenario.suggestedPhrases.length > 0
              ? scenario.suggestedPhrases[0]
              : "Could I have a large cappuccino please?";
          setInputText(sample);
        }, 1500);
      } else {
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[750px] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={scenario.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=partner"}
            alt="AI Partner Avatar"
            className="w-12 h-12 rounded-full border-2 border-white/60 bg-white"
          />
          <div>
            <h2 className="font-extrabold text-lg leading-tight">{scenario.title}</h2>
            <div className="flex items-center gap-2 text-xs text-emerald-100">
              <span className="bg-emerald-700/60 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                {scenario.level}
              </span>
              <span>{scenario.topic}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-colors"
        >
          Đổi Kịch Bản
        </button>
      </div>

      {/* Suggested Phrases Pills */}
      {scenario.suggestedPhrases && scenario.suggestedPhrases.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-500 whitespace-nowrap">Gợi ý mẫu câu:</span>
          {scenario.suggestedPhrases.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(phrase)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-full whitespace-nowrap transition-colors"
            >
              {phrase}
            </button>
          ))}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                  isUser
                    ? "bg-emerald-600 text-white rounded-br-none"
                    : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  {!isUser && (
                    <button
                      onClick={() => playSpeech(msg.text)}
                      className="p-1 hover:bg-slate-200 rounded-full text-slate-500"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Pronunciation Word Pills (for User) */}
                {isUser && msg.pronunciation?.words && msg.pronunciation.words.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-500/50 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-200">
                      Điểm phát âm: {msg.pronunciation.overallScore}%
                    </span>
                    <div className="w-full flex flex-wrap gap-1 mt-1">
                      {msg.pronunciation.words.map((w, wIdx) => (
                        <span
                          key={wIdx}
                          title={`Score: ${w.score}% | IPA: ${w.expectedIpa || ""}`}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                            w.status === "GOOD"
                              ? "bg-emerald-400 text-emerald-950"
                              : w.status === "OK"
                              ? "bg-amber-300 text-amber-950"
                              : "bg-rose-400 text-rose-950"
                          }`}
                        >
                          {w.word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Grammar Correction Alert */}
              {isUser && msg.grammarCorrection && (
                <div className="mt-1.5 max-w-[80%] p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Lưu ý ngữ pháp:</strong>
                    <span>{msg.grammarCorrection}</span>
                  </div>
                </div>
              )}

              {/* Native Expression Suggestion */}
              {isUser && msg.naturalAlternative && (
                <div className="mt-1 max-w-[80%] p-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-900">Cách nói bản xứ: </span>
                    <span>"{msg.naturalAlternative}"</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Audio Wave Recording State */}
      {isRecording && (
        <div className="p-3 bg-rose-50 border-t border-rose-200 flex items-center justify-center gap-3 animate-pulse">
          <div className="flex gap-1 items-center h-6">
            <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce"></span>
            <span className="w-1 h-6 bg-rose-600 rounded-full animate-bounce [animation-delay:0.1s]"></span>
            <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1 h-7 bg-rose-600 rounded-full animate-bounce [animation-delay:0.15s]"></span>
          </div>
          <span className="text-sm font-bold text-rose-700">Đang thu âm giọng nói của bạn... Hãy nói câu tiếng Anh</span>
        </div>
      )}

      {/* Input Box Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-2xl font-bold transition-all shadow-sm ${
            isRecording
              ? "bg-rose-500 text-white animate-bounce"
              : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
          }`}
          title={isRecording ? "Dừng thu âm" : "Bật micro thu âm"}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-600" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Nhập hoặc nói câu tiếng Anh của bạn..."
          className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || loading}
          className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-2xl shadow-sm transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
