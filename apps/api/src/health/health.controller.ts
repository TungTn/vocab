import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService
  ) {}

  @Get()
  async getHealth() {
    const [pgHealth, redisHealth] = await Promise.all([
      this.prismaService.checkHealth(),
      this.redisService.checkHealth()
    ]);

    const memoryUsage = process.memoryUsage();

    const isHealthy = pgHealth.status === "up" && redisHealth.status === "up";

    return {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      services: {
        postgres: pgHealth,
        redis: redisHealth
      },
      system: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        nodeVersion: process.version
      }
    };
  }
}
