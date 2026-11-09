import { Module } from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { LessonsController } from "./lessons.controller";
import { GradingEngineService } from "./grading-engine.service";

@Module({
  controllers: [LessonsController],
  providers: [LessonsService, GradingEngineService],
  exports: [LessonsService, GradingEngineService]
})
export class LessonsModule {}
