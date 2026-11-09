---
phase: 6
title: "AI Speaking & Pronunciation"
status: pending
priority: P1
effort: "3d"
dependencies: [1, 2]
---

# Phase 6: AI Speaking & Pronunciation

## Overview
Xay dung he thong tro ly ao luyen giao tiep phan xa thoi gian thuc (AI Conversational Partner) dua tren Google Gemini Multimodal / Audio API, module danh gia phat am (Pronunciation Scoring Engine) o cap do am tiet/ngu am (Phoneme/IPA), va cac tinh huong dong vai giao tiep (Roleplay Scenarios) thuc te kem phan hoi sua loi ngu phap tu nhien.

## Requirements
- **Functional Requirements:**
  - **Conversational Roleplay Engine**:
    - Cac kich ban tinh huong duoc thiet ke san theo cap do: Order ca phe tai London (A1), Hoi duong tai Tokyo (A2), Dat phong khach san tai Paris (B1), Phong van xin viec (B2).
    - AI dong vai nhan vat trong tinh huong, hoi dap bang giong doc tu nhien (TTS) va duy tri bo nho ngu canh (Contextual Memory) trong buoi hoi thoai.
  - **Speech-to-Text (STT) & Audio Stream**:
    - Thu am giong noi nguoi hoc tu trinh duyet (Web MediaRecorder) hoac Mobile (Expo Audio).
    - Truyen tai audio len Backend thong qua WebSocket / REST de Gemini hoac Whisper chuyen thanh van ban (Transcription).
  - **Pronunciation Assessment & Feedback**:
    - So sanh chuoi phat am cua nguoi hoc voi cau chuan mau thong qua ma hoa ngu am IPA va thuat toan Phoneme Edit Distance.
    - Cham diem tren thang 100: Accuracy (Do chinh xac), Fluency (Do troi chay), Completeness (Do day du).
    - To mau truc quan tung tu: Xanh la (Phat am tot >80%), Vang (Tam on 50-80%), Do (Phat am sai <50%).
  - **Grammar & Expression Coach**:
    - AI phan tich cac cau noi cua nguoi hoc, chi ra loi dung tu chua tu nhien hoac sai ngu phap, va de xuat cach dien dat tot hon cua nguoi ban xu.
- **Non-functional Requirements:**
  - Tong do tre hoi dap tu luc user dung noi den khi nhan duoc cau tra loi cua AI duoi 1.5 giay.
  - TTS am thanh trong treo, khong bi giat lag nho co che streaming audio chunk.

## Architecture
```
[User Mic Input (Web/Mobile)]
              │ (Audio Blob / Base64 / Stream)
              ▼
   [NestJS AI Gateway / WebSocket]
              │
      ┌───────┴──────────────────────┐
      ▼                              ▼
[Pronunciation Scorer]       [Gemini API Agent]
  - IPA Phoneme Alignment      - Roleplay Prompt Persona
  - Levenshtein Distance       - Context History
  - Word Accuracy Coloring     - Grammar Correction Feedback
      │                              │
      └───────┬──────────────────────┘
              ▼
      [TTS Audio Generator] ─── (Streaming MP3) ───► [Client Audio Player]
```

## Related Code Files
- Create: `apps/api/src/ai/ai.module.ts`, `apps/api/src/ai/ai.service.ts`
- Create: `apps/api/src/ai/gemini-partner.service.ts`
- Create: `apps/api/src/ai/pronunciation-scorer.service.ts`
- Create: `apps/api/src/ai/tts.service.ts`
- Create: `apps/api/src/ai/scenarios.data.ts`
- Modify: `apps/api/prisma/schema.prisma` (Them SpeakingSession, RoleplayScenario)

## Implementation Steps
1. Tich hop Google GenAI SDK (`@google/genai`) vao NestJS Service:
   - Khoi tao Gemini model `gemini-2.5-flash` hoac `gemini-2.0-flash` cho chat conversation voi System Prompt dong vai.
   - Thiet lap nhiem vu tra ve format JSON gom: `{ replyText: string, phoneticHints: string, grammarCorrection: string | null }`.
2. Trien khai `PronunciationScorerService`:
   - Chuyen van ban goc va van ban nguoi dung doc sang bieu dien IPA (su dung thu vien IPA dictionary).
   - Tinh toan do tuong dong Levenshtein Distance tren tung am tiet.
   - Tra ve danh sach tu kem diem so `[{ word: "delicious", score: 92, status: "GOOD" }, { word: "restaurant", score: 45, status: "BAD" }]`.
3. Trien khai `TtsService`:
   - Chuyen doi van ban phan hoi cua AI thanh audio thong qua Google Cloud TTS hoac Edge TTS voi giong doc chat luong cao (en-US-Neural2, ja-JP-Neural2...).
   - Luu tru tam cac file am thanh pho bien vao MinIO de giam chi phi goi TTS lap lai.
4. Xay dung Gateway WebSocket (`@WebSocketGateway()`) cho speaking session:
   - Su kien `send_audio`: Nhan audio stream tu client.
   - Su kien `ai_response`: Phat tra ket qua danh gia + phan hoi am thanh cho client.
5. Luu ket qua buoi luyen noi vao Database (`SpeakingSession`): do dai buoi noi, diem phat am trung binh, so luong tu vung moi da su dung.

## Success Criteria
- [ ] Nguoi hoc noi vao micro, he thong nhan dien giong noi va hien thi van ban chinh xac >90%.
- [ ] Cham diem tung tu trong cau voi giao dien to mau truc quan (xanh, vang, do).
- [ ] AI dong vai tro chuyen thong minh theo dung tinh huong dat phong, goi mon ma khong lac de.
- [ ] Do tre phan hoi duoi 1.5 giay tren ket noi mang binh thuong.

## Risk Assessment
- **Tieng on moi truong lam giam do chinh xac cua STT:** Can kem bo loc Voice Activity Detection (VAD) phia client truoc khi upload file audio.
- **Chi phi goi API Gemini / TTS:** Cache cac am thanh co dinh, gioi han thoi luong moi buoi goi phu hop voi tai khoan thuong (vi du: 10 luot noi/ngay, tai khoan Premium khong gioi han).

## Security Considerations
- An toan API Key: Tuyet doi khong de lo Gemini API key o phia Frontend; toan bo request AI phai di qua NestJS backend proxy da duoc chung thuc JWT.
- Audio data privacy: Khong luu tru am thanh nguoi dung qua 24 gio tru phi co su dong y cho muc dich hoc tap ca nhan.
