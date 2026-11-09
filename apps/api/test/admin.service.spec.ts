import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdminService } from "../src/admin/admin.service";
import { UserRole, LanguageLevel } from "@linguaflow/shared-types";

describe("AdminService", () => {
  let service: AdminService;
  let prisma: any;
  let pronunciationScorer: any;
  let ttsService: any;

  beforeEach(() => {
    prisma = {
      course: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "c-1", ...data })),
        findUnique: vi.fn()
      },
      unit: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "u-1", ...data }))
      },
      lesson: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "l-1", ...data }))
      },
      exercise: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "ex-1", ...data }))
      },
      deck: {
        findUnique: vi.fn()
      },
      flashcard: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "card-1", ...data }))
      },
      user: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };

    pronunciationScorer = {
      getIpa: vi.fn().mockReturnValue("/kɔːfi/")
    };

    ttsService = {
      getAudioUrlForText: vi.fn().mockResolvedValue("https://tts.example.com/audio.mp3")
    };

    service = new AdminService(prisma, pronunciationScorer, ttsService);
  });

  it("should create a new course with CEFR level", async () => {
    const course = await service.createCourse({
      code: "en-b1",
      title: "Tiếng Anh Trung Cấp (B1)",
      description: "Nâng cao phản xạ giao tiếp tự tin.",
      level: LanguageLevel.B1
    });

    expect(course.id).toBe("c-1");
    expect(course.level).toBe("B1");
    expect(prisma.course.create).toHaveBeenCalled();
  });

  it("should bulk import flashcards with automated IPA and TTS audio generation", async () => {
    prisma.deck.findUnique.mockResolvedValue({ id: "deck-1" });

    const result = await service.bulkImportFlashcards("deck-1", [
      {
        term: "espresso",
        meaning: "Cà phê espresso đậm đặc",
        pos: "noun",
        exampleText: "One espresso please.",
        exampleTranslation: "Cho tôi một ly espresso."
      },
      {
        term: "croissant",
        meaning: "Bánh sừng bò",
        pos: "noun"
      }
    ]);

    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(2);
    expect(pronunciationScorer.getIpa).toHaveBeenCalledTimes(2);
    expect(ttsService.getAudioUrlForText).toHaveBeenCalledTimes(2);
    expect(prisma.flashcard.create).toHaveBeenCalledTimes(2);
  });

  it("should update user role by admin", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", role: UserRole.USER });
    prisma.user.update.mockResolvedValue({ id: "user-1", role: UserRole.TEACHER });

    const updated = await service.updateUserRole("user-1", UserRole.TEACHER);
    expect(updated.role).toBe(UserRole.TEACHER);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { role: UserRole.TEACHER }
    });
  });

  it("should refill user hearts to 5", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", hearts: 0 });
    prisma.user.update.mockResolvedValue({ id: "user-1", hearts: 5 });

    const updated = await service.refillUserHearts("user-1");
    expect(updated.hearts).toBe(5);
  });
});
