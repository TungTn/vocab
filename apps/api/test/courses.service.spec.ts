import { describe, it, expect, beforeEach, vi } from "vitest";
import { CoursesService } from "../src/courses/courses.service";
import { LanguageLevel } from "@linguaflow/shared-types";

describe("CoursesService", () => {
  let service: CoursesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      course: {
        findMany: vi.fn(),
        findUnique: vi.fn()
      }
    };

    service = new CoursesService(prisma);
  });

  it("should list courses with total units count", async () => {
    prisma.course.findMany.mockResolvedValue([
      {
        id: "course-1",
        code: "en-vi-a1",
        title: "English A1",
        description: "Beginner English",
        language: "en",
        level: LanguageLevel.A1,
        thumbnailUrl: null,
        _count: { units: 5 },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const courses = await service.listCourses("en");

    expect(courses.length).toBe(1);
    expect(courses[0].totalUnits).toBe(5);
    expect(courses[0].level).toBe(LanguageLevel.A1);
  });

  it("should unlock first lesson and lock subsequent until previous completed", async () => {
    prisma.course.findUnique.mockResolvedValue({
      id: "course-1",
      code: "en-vi-a1",
      title: "English A1",
      description: "Beginner English",
      language: "en",
      level: LanguageLevel.A1,
      thumbnailUrl: null,
      units: [
        {
          id: "unit-1",
          title: "Unit 1",
          description: "Desc",
          orderIndex: 1,
          lessons: [
            {
              id: "lesson-1",
              title: "Lesson 1",
              orderIndex: 1,
              xpReward: 15,
              _count: { exercises: 5 },
              userLessonProgress: [{ completed: true, score: 90 }] // Lesson 1 is completed!
            },
            {
              id: "lesson-2",
              title: "Lesson 2",
              orderIndex: 2,
              xpReward: 15,
              _count: { exercises: 5 },
              userLessonProgress: [] // Not completed
            },
            {
              id: "lesson-3",
              title: "Lesson 3",
              orderIndex: 3,
              xpReward: 15,
              _count: { exercises: 5 },
              userLessonProgress: []
            }
          ]
        }
      ]
    });

    const hierarchy = await service.getCourseHierarchy("course-1", "user-1");

    const lessons = hierarchy.units[0].lessons;
    expect(lessons[0].isCompleted).toBe(true);
    expect(lessons[0].isLocked).toBe(false);

    // Lesson 2 is unlocked because Lesson 1 was completed
    expect(lessons[1].isCompleted).toBe(false);
    expect(lessons[1].isLocked).toBe(false);

    // Lesson 3 is locked because Lesson 2 was NOT completed
    expect(lessons[2].isCompleted).toBe(false);
    expect(lessons[2].isLocked).toBe(true);
  });
});
