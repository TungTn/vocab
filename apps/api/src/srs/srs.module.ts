import { Module } from "@nestjs/common";
import { SrsService } from "./srs.service";
import { SrsController } from "./srs.controller";

@Module({
  controllers: [SrsController],
  providers: [SrsService],
  exports: [SrsService]
})
export class SrsModule {}
