import { describe, it, expect, beforeEach, vi } from "vitest";
import { OfflineSrsService } from "../services/offline-srs.service";
import { CardRating, CardState } from "@linguaflow/shared-types";
import { notificationService } from "../services/notification.service";
import { audioRecorder } from "../components/audio-recorder";

describe("Mobile Offline & Media Services", () => {
  let srsService: OfflineSrsService;

  beforeEach(() => {
    srsService = new OfflineSrsService([
      {
        id: "offline-card-1",
        term: "cappuccino",
        ipa: "/ˌkæpəˈtʃiːnoʊ/",
        meaning: "Cà phê cappuccino (espresso pha sữa nóng và bọt sữa)",
        examples: [{ text: "Could I have a large cappuccino please?", translation: "Cho tôi một ly cappuccino lớn nhé?" }],
        stability: 2.0,
        difficulty: 4.5,
        reps: 1,
        lapses: 0,
        scheduledDays: 1,
        state: CardState.REVIEW,
        dueAt: new Date().toISOString()
      }
    ]);
  });

  it("should retrieve due cards from local offline storage", () => {
    const due = srsService.getDueCards();
    expect(due.length).toBeGreaterThanOrEqual(1);
    expect(due.some((c) => c.term === "cappuccino")).toBe(true);
  });

  it("should record offline review using FSRS engine directly on device", () => {
    const initialDue = srsService.getDueCards()[0];
    const updated = srsService.recordOfflineReview(initialDue.id, CardRating.GOOD);

    expect(updated).not.toBeNull();
    expect(updated?.stability).toBeGreaterThan(0);
    expect(updated?.scheduledDays).toBeGreaterThanOrEqual(1);
    expect(srsService.getPendingCount()).toBe(1);
  });

  it("should schedule streak reminder notifications", () => {
    notificationService.cancelAllNotifications();
    const notif = notificationService.scheduleStreakReminder(5, 20, 0);

    expect(notif.title).toContain("chuỗi học tập");
    expect(notif.body).toContain("5 ngày");
    expect(notificationService.getScheduledNotifications().length).toBe(1);
  });

  it("should start and stop audio recording", () => {
    audioRecorder.startRecording();
    expect(audioRecorder.getState().isRecording).toBe(true);

    const recording = audioRecorder.stopRecording();
    expect(audioRecorder.getState().isRecording).toBe(false);
    expect(recording.uri).toBeDefined();
    expect(recording.audioBase64).toBeDefined();
  });
});
