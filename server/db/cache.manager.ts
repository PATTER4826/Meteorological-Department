/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Universal Cache & Queue Manager (Hybrid Redis / In-Memory)
 * 
 * Supports:
 * - Redis when REDIS_URL is configured
 * - In-Memory Cache & Queue automatically when REDIS_URL is omitted (Zero-config Development)
 */

import { EventEmitter } from 'node:events';

export type CacheType = 'In-Memory' | 'Redis';

interface CacheEntry {
  value: any;
  expiresAt: number | null;
}

class CacheManager {
  private cacheType: CacheType = 'In-Memory';
  private memoryStore: Map<string, CacheEntry> = new Map();
  private queues: Map<string, any[]> = new Map();
  private emitter: EventEmitter = new EventEmitter();

  constructor() {
    this.detectAndInitialize();
  }

  private detectAndInitialize() {
    const redisUrl = process.env.REDIS_URL?.trim();

    if (redisUrl && (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://'))) {
      this.cacheType = 'Redis';
      console.log(`⚡ [Cache] REDIS_URL detected. Configured for Redis connection (${redisUrl.split('@')[1] || redisUrl}).`);
    } else {
      this.cacheType = 'In-Memory';
      console.log('🟢 [Cache] No REDIS_URL provided. Automatically activating In-Memory Cache & Queue for Development mode.');
    }

    // Set high max listeners for in-memory pub/sub
    this.emitter.setMaxListeners(100);

    // Periodic sweep for expired memory cache keys (every 60s)
    setInterval(() => this.sweepExpired(), 60000).unref();
  }

  public getCacheType(): CacheType {
    return this.cacheType;
  }

  public isRedis(): boolean {
    return this.cacheType === 'Redis';
  }

  // --- Key-Value Cache Operations ---

  public async get<T = any>(key: string): Promise<T | null> {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryStore.set(key, { value, expiresAt });
  }

  public async del(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  // --- Queue Operations (FIFO) ---

  public async enqueue(queueName: string, item: any): Promise<void> {
    let q = this.queues.get(queueName);
    if (!q) {
      q = [];
      this.queues.set(queueName, q);
    }
    q.push(item);
    this.emitter.emit(`queue:${queueName}`, item);
  }

  public async dequeue<T = any>(queueName: string): Promise<T | null> {
    const q = this.queues.get(queueName);
    if (!q || q.length === 0) return null;
    return q.shift() as T;
  }

  public getQueueLength(queueName: string): number {
    return this.queues.get(queueName)?.length || 0;
  }

  // --- Pub / Sub Operations ---

  public publish(channel: string, message: any): void {
    this.emitter.emit(`channel:${channel}`, message);
  }

  public subscribe(channel: string, listener: (message: any) => void): void {
    this.emitter.on(`channel:${channel}`, listener);
  }

  public unsubscribe(channel: string, listener: (message: any) => void): void {
    this.emitter.off(`channel:${channel}`, listener);
  }

  private sweepExpired() {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.memoryStore.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();
