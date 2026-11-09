import { Controller, Post, Get, Body, Param, UseGuards, UsePipes } from "@nestjs/common";
import { ProgressService } from "./progress.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  UpdateLessonProgressSchema,
  UpdateLessonProgress
} from "@linguaflow/shared-types";

@Controller("progress")
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post("lesson")
  @UsePipes(new ZodValidationPipe(UpdateLessonProgressSchema))
  async recordLesson(
    @CurrentUser("userId") userId: string,
    @Body() dto: UpdateLessonProgress
  ) {
    return this.progressService.recordLessonProgress(userId, dto);
  }

  @Get("course/:courseId")
  async getCourseProgress(
    @CurrentUser("userId") userId: string,
    @Param("courseId") courseId: string
  ) {
    return this.progressService.getCourseProgress(userId, courseId);
  }

  @Get("summary")
  async getSummary(@CurrentUser("userId") userId: string) {
    return this.progressService.getUserProgressSummary(userId);
  }
}
