import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthController } from "../src/health/health.controller";
import { PrismaService } from "../src/prisma/prisma.service";
import { RedisService } from "../src/redis/redis.service";

describe("HealthController", () => {
  let controller: HealthController;
  let prismaService: PrismaService;
  let redisService: RedisService;

  beforeEach(() => {
    prismaService = {
      checkHealth: vi.fn().mockResolvedValue({ status: "up", latencyMs: 5 })
    } as unknown as PrismaService;

    redisService = {
      checkHealth: vi.fn().mockResolvedValue({ status: "up", latencyMs: 2 })
    } as unknown as RedisService;

    controller = new HealthController(prismaService, redisService);
  });

  it("should return ok status when postgres and redis are up", async () => {
    const result = await controller.getHealth();

    expect(result.status).toBe("ok");
    expect(result.services.postgres.status).toBe("up");
    expect(result.services.redis.status).toBe("up");
    expect(result.system.nodeVersion).toBeDefined();
  });

  it("should return degraded status when postgres is down", async () => {
    vi.spyOn(prismaService, "checkHealth").mockResolvedValue({ status: "down", latencyMs: 50 });

    const result = await controller.getHealth();

    expect(result.status).toBe("degraded");
    expect(result.services.postgres.status).toBe("down");
  });
});
