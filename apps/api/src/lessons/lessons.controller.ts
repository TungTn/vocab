import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UsePipes
} from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  CheckAnswerRequestSchema,
  CheckAnswerRequest,
  CompleteLessonRequestSchema,
  CompleteLessonRequest
} from "@linguaflow/shared-types";

@Controller("lessons")
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get(":id/session")
  async getLessonSession(
    @Param("id") lessonId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.lessonsService.getLessonSession(lessonId, userId);
  }

  @Post(":id/check-answer")
  @UsePipes(new ZodValidationPipe(CheckAnswerRequestSchema))
  async checkAnswer(
    @Param("id") lessonId: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: CheckAnswerRequest
  ) {
    return this.lessonsService.checkAnswer(lessonId, userId, dto);
  }

  @Post(":id/complete")
  @UsePipes(new ZodValidationPipe(CompleteLessonRequestSchema))
  async completeLesson(
    @Param("id") lessonId: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: CompleteLessonRequest
  ) {
    return this.lessonsService.completeLesson(lessonId, userId, dto);
  }

  @Post("refill-hearts")
  async refillHearts(@CurrentUser("userId") userId: string) {
    return this.lessonsService.refillHearts(userId, 5);
  }
}
