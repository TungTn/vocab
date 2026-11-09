import { Module } from "@nestjs/common";
import { PronunciationScorerService } from "./pronunciation-scorer.service";
import { GeminiPartnerService } from "./gemini-partner.service";
import { TtsService } from "./tts.service";
import { SpeakingService } from "./speaking.service";
import { SpeakingController } from "./speaking.controller";
import { GamificationModule } from "../gamification/gamification.module";

import { SpeakingGateway } from "./speaking.gateway";

@Module({
  imports: [GamificationModule],
  controllers: [SpeakingController],
  providers: [
    PronunciationScorerService,
    GeminiPartnerService,
    TtsService,
    SpeakingService,
    SpeakingGateway
  ],
  exports: [
    SpeakingService,
    PronunciationScorerService,
    GeminiPartnerService,
    TtsService,
    SpeakingGateway
  ]
})
export class AiModule {}
