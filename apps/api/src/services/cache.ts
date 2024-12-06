import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async cacheAssets(address: string, data: any) {
    const key = `assets:${address.toLowerCase()}`;
    await this.redis.setex(key, 300, JSON.stringify(data)); // 5分钟缓存
  }
  
  async getCachedAssets(address: string) {
    const key = `assets:${address.toLowerCase()}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async cacheHistory(address: string, days: number, data: any) {
    const key = `history:${address.toLowerCase()}:${days}`;
    await this.redis.setex(key, 3600, JSON.stringify(data)); // 1小时缓存
  }
  
  async getCachedHistory(address: string, days: number) {
    const key = `history:${address.toLowerCase()}:${days}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
}
