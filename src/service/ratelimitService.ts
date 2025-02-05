import Redis from "ioredis";
import "dotenv/config";
import { AppError } from "../middleware/error.middleware";

interface RateLimitConfig {
  freelimit?: number;
}

export class RateLimitService {
  private redis: Redis;
  private readonly FREE_LIMIT: number;
  private readonly WINDOW_SIZE_IN_SECONDS = 86400;

  constructor(config: RateLimitConfig) {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.FREE_LIMIT = config.freelimit ?? 50;
  }

  async checkRateLimit(key: string): Promise<void> {
    const count = await this.redis.get(key);
    const currentCount = count ? parseInt(count) : 0;

    if (currentCount >= this.FREE_LIMIT) {
      throw new AppError(
        429,
        `Rate limit exceeded. Maximum ${this.FREE_LIMIT} requests per day allowed.`
      );
    }

    if (currentCount === 0) {
      await this.redis.setex(key as string, this.WINDOW_SIZE_IN_SECONDS, "1");
    } else {
      await this.redis.incr(key as string);
    }
  }
}
