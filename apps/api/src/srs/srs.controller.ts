import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UsePipes
} from "@nestjs/common";
import { SrsService } from "./srs.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  SubmitCardReviewSchema,
  SubmitCardReview,
  ReviewQueueQuerySchema,
  ReviewQueueQuery
} from "@linguaflow/shared-types";

@Controller("srs")
@UseGuards(JwtAuthGuard)
export class SrsController {
  constructor(private readonly srsService: SrsService) {}

  @Get("review-queue")
  @UsePipes(new ZodValidationPipe(ReviewQueueQuerySchema))
  async getReviewQueue(
    @CurrentUser("userId") userId: string,
    @Query() query: ReviewQueueQuery
  ) {
    return this.srsService.getReviewQueue(userId, query);
  }

  @Post("review")
  @UsePipes(new ZodValidationPipe(SubmitCardReviewSchema))
  async submitReview(
    @CurrentUser("userId") userId: string,
    @Body() dto: SubmitCardReview
  ) {
    return this.srsService.submitReview(userId, dto);
  }

  @Get("stats")
  async getStats(@CurrentUser("userId") userId: string) {
    return this.srsService.getStats(userId);
  }
}
