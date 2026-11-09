import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "info" },
        { emit: "stdout", level: "warn" },
        { emit: "stdout", level: "error" }
      ]
    });

    // Slow query log (> 200ms)
    // @ts-expect-error Prisma event typing
    this.$on("query", (e: { query: string; params: string; duration: number }) => {
      if (e.duration > 200) {
        this.logger.warn(`[SLOW QUERY ${e.duration}ms]: ${e.query} - Params: ${e.params}`);
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Prisma PostgreSQL connection established successfully.");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Prisma PostgreSQL disconnected.");
  }

  async checkHealth(): Promise<{ status: "up" | "down"; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      return { status: "up", latencyMs: Date.now() - start };
    } catch {
      return { status: "down", latencyMs: Date.now() - start };
    }
  }
}
