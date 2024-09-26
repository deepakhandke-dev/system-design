// src/redis/redis.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from "@nestjs/common";
import Redis, { Redis as RedisClient } from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: RedisClient;

  async onModuleInit() {
    this.redisClient = new Redis({
      host: "localhost",
      port: 6379,
    });
    this.redisClient.on("connect", () => this.logger.log("Connected to Redis"));
    this.redisClient.on("error", (err) => this.logger.error("Redis error", err));
  }

  getClient(): RedisClient {
    return this.redisClient;
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
    this.logger.log("Disconnected from Redis");
  }
}
