import IORedis, { Redis as IOredis } from 'ioredis'

export class Redis {
  private static client: Redis
  private redis: IOredis

  private constructor() {
    this.redis = process.env.REDIS_URI ? new IORedis(process.env.REDIS_URI) : null
  }

  public static connect(): Redis {
    if (!this.client) {
      this.client = new Redis()
    }
    this.client.redis?.on('connect', () => console.log('redis: connected'))
    this.client.redis?.on('ready', () => console.log('redis: ready'))
    this.client.redis?.on('error', console.error)
    return this.client
  }

  public async get(key: string): Promise<any> {
    const result = await this.redis?.get(key)
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
        return await this.redis?.set(key, JSON.stringify(data), 'EX', ex) === 'OK'
      } else {
        return await this.redis?.set(key, JSON.stringify(data)) === 'OK'
      }
    } catch (error) {
      if (ex) {
        return await this.redis?.set(key, data as any, 'EX', ex) === 'OK'
      } else {
        return await this.redis?.set(key, data as any) === 'OK'
      }
    }
  }

  public async del(key: string): Promise<boolean> {
    return await this.redis?.del(key) === 1
  }

  public async getFromCacheFirst<T>(key: string, fn: () => T | Promise<T>, ex?: number): Promise<T> {
    try {
      const result = await this.get(key)
      if (result) return result

      const data = await fn()
      await this.set(key, data, ex)
      return data
    } catch (error) {
      return await fn()
    }
  }
}
