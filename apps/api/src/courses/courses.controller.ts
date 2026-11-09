import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { CoursesService } from "./courses.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { LanguageLevel } from "@linguaflow/shared-types";

@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async listCourses(
    @Query("language") language?: string,
    @Query("level") level?: LanguageLevel
  ) {
    return this.coursesService.listCourses(language || "en", level);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async getCourse(
    @Param("id") courseId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.coursesService.getCourseHierarchy(courseId, userId);
  }
}
