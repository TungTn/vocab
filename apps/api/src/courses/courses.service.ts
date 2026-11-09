import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LanguageLevel } from "@linguaflow/shared-types";

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCourses(language: string = "en", level?: LanguageLevel) {
    const courses = await this.prisma.course.findMany({
      where: {
        language,
        ...(level && { level })
      },
      include: {
        units: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
              include: {
                _count: {
                  select: { exercises: true }
                }
              }
            }
          }
        },
        _count: {
          select: { units: true }
        }
      },
      orderBy: { level: "asc" }
    });

    return courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      language: c.language,
      level: c.level,
      thumbnailUrl: c.thumbnailUrl,
      totalUnits: c._count.units,
      units: c.units,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));
  }

  async getCourseHierarchy(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        units: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
              include: {
                _count: {
                  select: { exercises: true }
                },
                userLessonProgress: {
                  where: { userId }
                }
              }
            }
          }
        }
      }
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    let previousLessonCompleted = true; // First lesson is unlocked by default

    const units = course.units.map((unit) => {
      const lessons = unit.lessons.map((lesson) => {
        const progress = lesson.userLessonProgress[0] || null;
        const isCompleted = progress?.completed || false;
        const isLocked = !previousLessonCompleted;

        // If this lesson was completed, the next one is unlocked
        previousLessonCompleted = isCompleted;

        return {
          id: lesson.id,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
          xpReward: lesson.xpReward,
          totalExercises: lesson._count.exercises,
          isCompleted,
          isLocked,
          score: progress?.score || 0
        };
      });

      return {
        id: unit.id,
        title: unit.title,
        description: unit.description,
        orderIndex: unit.orderIndex,
        lessons
      };
    });

    return {
      id: course.id,
      code: course.code,
      title: course.title,
      description: course.description,
      language: course.language,
      level: course.level,
      thumbnailUrl: course.thumbnailUrl,
      units
    };
  }
}
