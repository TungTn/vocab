import { Controller, Get, Post, Body, UseGuards, UsePipes } from "@nestjs/common";
import { PlacementService } from "./placement.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  PlacementTestSubmissionSchema,
  PlacementTestSubmission
} from "@linguaflow/shared-types";

@Controller("placement")
export class PlacementController {
  constructor(private readonly placementService: PlacementService) {}

  @Get("questions")
  getQuestions() {
    return this.placementService.getQuestions();
  }

  @Post("submit")
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(PlacementTestSubmissionSchema))
  async submitTest(
    @CurrentUser("userId") userId: string,
    @Body() dto: PlacementTestSubmission
  ) {
    return this.placementService.evaluateTest(userId, dto);
  }

  @Get("latest")
  @UseGuards(JwtAuthGuard)
  async getLatestTest(@CurrentUser("userId") userId: string) {
    return this.placementService.getLatestTest(userId);
  }
}
