import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PronunciationScorerService } from "../ai/pronunciation-scorer.service";
import { TtsService } from "../ai/tts.service";
import { UserRole, LanguageLevel } from "@linguaflow/shared-types";

export interface BulkImportCardInput {
  term: string;
  meaning: string;
  pos?: string;
  exampleText?: string;
  exampleTranslation?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pronunciationScorer: PronunciationScorerService,
    private readonly ttsService: TtsService
  ) {}

  // Course & Curriculum Management
  async createCourse(data: {
    code: string;
    title: string;
    description: string;
    language?: string;
    level: LanguageLevel;
  }) {
    return this.prisma.course.create({
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        language: data.language || "en",
        level: data.level as any
      }
    });
  }

  async createUnit(courseId: string, data: { title: string; description?: string; orderIndex?: number }) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException("Course not found");

    return this.prisma.unit.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        orderIndex: data.orderIndex ?? 0
      }
    });
  }

  async createLesson(unitId: string, data: { title: string; xpReward?: number; orderIndex?: number }) {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException("Unit not found");

    return this.prisma.lesson.create({
      data: {
        unitId,
        title: data.title,
        xpReward: data.xpReward ?? 15,
        orderIndex: data.orderIndex ?? 0
      }
    });
  }

  async createExercise(lessonId: string, data: {
    type: string;
    prompt: string;
    content: any;
    orderIndex?: number;
  }) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException("Lesson not found");

    return this.prisma.exercise.create({
      data: {
        lessonId,
        type: data.type,
        prompt: data.prompt,
        content: data.content,
        orderIndex: data.orderIndex ?? 0
      }
    });
  }

  // Bulk Import Flashcards with automated IPA and Audio synthesis
  async bulkImportFlashcards(deckId: string, items: BulkImportCardInput[]) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException("Deck not found");

    const createdCards: any[] = [];

    for (const item of items) {
      const cleanTerm = item.term.trim();
      if (!cleanTerm) continue;

      const ipa = this.pronunciationScorer.getIpa(cleanTerm);
      const audioUrl = await this.ttsService.getAudioUrlForText(cleanTerm);

      const examples = item.exampleText
        ? [{ text: item.exampleText, translation: item.exampleTranslation || "" }]
        : [];

      const card = await this.prisma.flashcard.create({
        data: {
          deckId,
          term: cleanTerm,
          ipa,
          meaning: item.meaning.trim(),
          pos: item.pos || "noun",
          examples,
          audioUrl
        }
      });

      createdCards.push(card);
    }

    this.logger.log(`Bulk imported ${createdCards.length} flashcards into deck ${deckId}`);
    return {
      success: true,
      deckId,
      importedCount: createdCards.length,
      cards: createdCards
    };
  }

  // User Management
  async listUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          xp: true,
          streak: true,
          hearts: true,
          gems: true,
          league: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.user.count()
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateUserRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    return this.prisma.user.update({
      where: { id: userId },
      data: { role }
    });
  }

  async refillUserHearts(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    return this.prisma.user.update({
      where: { id: userId },
      data: { hearts: 5 }
    });
  }
}
