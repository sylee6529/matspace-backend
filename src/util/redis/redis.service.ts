import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly client: Redis) {}

  async getValue(key: string): Promise<string> {
    return this.client.get(key);
  }

  async setValue(key: string, value: string) {
    await this.client.set(key, value);
  }

  async getHashValue(key: string, field: string): Promise<string> {
    return this.client.hget(key, field);
  }

  async setHashValue(key: string, field: string, value: string) {
    await this.client.hset(key, field, value);
  }

  async setList(key: any, data: any[]) {
    console.log('redis 저장', key);
    const dataList = data.map((item) => JSON.stringify(item));
    await this.client.lpush(key, ...dataList);
  }

  async getList(key: any): Promise<any[]> {
    console.log('redis 조회', key);
    const data = await this.client.lrange(key, 0, -1);
    return data.map((item) => JSON.parse(item));
  }
}
