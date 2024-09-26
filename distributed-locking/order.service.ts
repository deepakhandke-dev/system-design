// src/order/order.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";
import Redlock from "redlock";

@Injectable()
export class OrderService {
  private redlock: Redlock;
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly redisService: RedisService) {
    // Initialize Redlock with Redis client
    this.redlock = new Redlock(
      [this.redisService.getClient()], // Injected Redis client from RedisService
      {
        retryCount: 10,
        retryDelay: 200, // time in ms
        retryJitter: 200, // randomness added to retry delays
      }
    );

    this.redlock.on("clientError", (err) => {
      this.logger.error("A Redis client encountered an error:", err);
    });
  }

  // Create order method with distributed lock using Redlock
  async createOrder(orderId: string): Promise<void> {
    const lockKey = `order_lock:${orderId}`; // Key for locking this particular order
    let lock;

    try {
      // Acquire the lock for 30 seconds (30000 ms)
      lock = await this.redlock.acquire([lockKey], 30000);

      this.logger.log(`Acquired lock for order: ${orderId}`);

      // Simulate order creation process
      await this.processOrder(orderId);

      this.logger.log(`Order created successfully: ${orderId}`);
    } catch (err) {
      this.logger.error(`Failed to create order ${orderId}:`, err);
      throw new Error("Could not create order");
    } finally {
      // Ensure the lock is always released, even if an error occurs
      if (lock) {
        await lock.release();
        this.logger.log(`Released lock for order: ${orderId}`);
      }
    }
  }

  // Simulate the actual process of order creation
  private async processOrder(orderId: string): Promise<void> {
    this.logger.log(`Processing order: ${orderId}`);

    // Simulate some work (e.g., interacting with DB, external systems, etc.)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    this.logger.log(`Order processing completed: ${orderId}`);
  }
}
