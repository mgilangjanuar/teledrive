import IORedis, { Redis as IOredis } from 'ioredis'

export class Redis {
  private static client: Redis
  private redis: IOredis

  private constructor() {
    this.redis = new IORedis(process.env.REDIS_URI)
  }

  public static connect(): Redis {
    if (!this.client) {
      this.client = new Redis()
    }
    return this.client
  }

  public async get(key: string): Promise<any> {
    const result = await this.redis.get(key)
    if (!result) return null
    try {
      return JSON.parse(result)
    } catch (error) {
      return result
    }
  }

  public async set(key: string, data: unknown, ex?: number): Promise<boolean> {
    try {
      if (ex) {
        return await this.redis.set(key, JSON.stringify(data), 'EX', ex) === 'OK'
      } else {
        return await this.redis.set(key, JSON.stringify(data)) === 'OK'
      }
    } catch (error) {
      if (ex) {
        return await this.redis.set(key, data as any, 'EX', ex) === 'OK'
      } else {
        return await this.redis.set(key, data as any) === 'OK'
      }
    }
  }

  public async getFromCacheFirst<T>(key: string, fn: () => T | Promise<T>, ex?: number): Promise<T> {
    const result = await this.get(key)
    if (result) return result

    const data = await fn()
    await this.set(key, data, ex)
    return data
  }
}
