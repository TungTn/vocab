import { Controller, Get, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@linguaflow/shared-types";

@Controller("analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  async getOverview() {
    return this.analyticsService.getDashboardOverview();
  }

  @Get("exercise-dropoff")
  async getExerciseDropOff() {
    return this.analyticsService.getExerciseDropOffHeatmap();
  }

  @Get("struggling-words")
  async getStrugglingWords() {
    return this.analyticsService.getStrugglingVocabulary(10);
  }

  @Get("dau-trend")
  async getDauTrend() {
    return this.analyticsService.getDauTrend();
  }
}
