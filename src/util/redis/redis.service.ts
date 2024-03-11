import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly expire_time = this.configService.get<string>('REDIS_EXPIRE_TIME');

  constructor(
    @Inject('REDIS_CLIENT') private readonly client: Redis,
    private readonly configService: ConfigService,
  ) {}

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

  async getListByRange(key: any, start: number, end: number): Promise<any[]> {
    const data = await this.client.lrange(key, start, end);
    return data.map((item) => JSON.parse(item));
  }

  async getListItemCount(key: any): Promise<number> {
    return this.client.llen(key);
  }

  async setExpire(key: string, time: number) {
    await this.client.expire(key, time);
  }

  async setSortedSet(key: string, score: number, value: string) {
    await this.client.zadd(key, score, value);
  }

  async getSortedSetByRange(key: string, start: number, end: number) {
    return this.client.zrange(key, start, end);
  }

  async getSortedSetCount(key: string) {
    return this.client.zcard(key);
  }
}
