import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host: string = this.configService.get<string>("REDIS_HOST") || "localhost";
    const port: number = Number(this.configService.get<number>("REDIS_PORT") || 6379);
    const password: string | undefined = this.configService.get<string>("REDIS_PASSWORD") || undefined;

    this.client = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      }
    });

    this.client.connect().catch((err) => {
      this.logger.warn(`Redis initial connect warning: ${err.message}`);
    });

    this.client.on("connect", () => this.logger.log("Redis client connected."));
    this.client.on("error", (err) => this.logger.error(`Redis error: ${err.message}`));
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log("Redis connection closed.");
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async checkHealth(): Promise<{ status: "up" | "down"; latencyMs: number }> {
    const start = Date.now();
    try {
      const pong = await this.client.ping();
      return {
        status: pong === "PONG" ? "up" : "down",
        latencyMs: Date.now() - start
      };
    } catch {
      return { status: "down", latencyMs: Date.now() - start };
    }
  }
}
