import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { HealthModule } from "./health/health.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { PlacementModule } from "./placement/placement.module";
import { ProgressModule } from "./progress/progress.module";
import { VocabularyModule } from "./vocabulary/vocabulary.module";
import { SrsModule } from "./srs/srs.module";
import { CoursesModule } from "./courses/courses.module";
import { LessonsModule } from "./lessons/lessons.module";
import { GamificationModule } from "./gamification/gamification.module";
import { AiModule } from "./ai/ai.module";
import { AdminModule } from "./admin/admin.module";
import { AnalyticsModule } from "./analytics/analytics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"]
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100 // default 100 requests per minute
      }
    ]),
    PrismaModule,
    RedisModule,
    HealthModule,
    UsersModule,
    AuthModule,
    PlacementModule,
    ProgressModule,
    VocabularyModule,
    SrsModule,
    CoursesModule,
    LessonsModule,
    GamificationModule,
    AiModule,
    AdminModule,
    AnalyticsModule
  ]
})
export class AppModule {}
