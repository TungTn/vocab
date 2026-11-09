import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UsePipes
} from "@nestjs/common";
import { SpeakingService } from "./speaking.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  AssessPronunciationSchema,
  AssessPronunciationInput,
  StartSpeakingSessionSchema,
  StartSpeakingSessionInput,
  SpeakingTurnInputSchema,
  SpeakingTurnInput
} from "@linguaflow/shared-types";

@Controller("speaking")
export class SpeakingController {
  constructor(private readonly speakingService: SpeakingService) {}

  @Get("scenarios")
  async getScenarios() {
    return this.speakingService.getScenarios();
  }

  @Get("scenarios/:id")
  async getScenario(@Param("id") id: string) {
    return this.speakingService.getScenarioById(id);
  }

  @Post("session/start")
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(StartSpeakingSessionSchema))
  async startSession(
    @CurrentUser("userId") userId: string,
    @Body() body: StartSpeakingSessionInput
  ) {
    return this.speakingService.startSession(userId, body.scenarioId);
  }

  @Post("turn")
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(SpeakingTurnInputSchema))
  async processTurn(
    @CurrentUser("userId") userId: string,
    @Body() body: SpeakingTurnInput
  ) {
    return this.speakingService.processTurn(userId, body);
  }

  @Post("assess-pronunciation")
  @UsePipes(new ZodValidationPipe(AssessPronunciationSchema))
  async assessPronunciation(@Body() body: AssessPronunciationInput) {
    return this.speakingService.assessPronunciation(
      body.referenceText,
      body.spokenText
    );
  }

  @Post("session/:id/complete")
  @UseGuards(JwtAuthGuard)
  async completeSession(
    @CurrentUser("userId") userId: string,
    @Param("id") sessionId: string
  ) {
    return this.speakingService.completeSession(userId, sessionId);
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  async getUserSessions(@CurrentUser("userId") userId: string) {
    return this.speakingService.getUserSessions(userId);
  }

  @Get("sessions/:id")
  @UseGuards(JwtAuthGuard)
  async getSessionById(
    @CurrentUser("userId") userId: string,
    @Param("id") sessionId: string
  ) {
    return this.speakingService.getSessionById(userId, sessionId);
  }
}
