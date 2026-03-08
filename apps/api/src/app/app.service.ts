import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getData(): Promise<{ message: string }> {
    const greeting = await this.prisma.greeting.upsert({
      where: { key: 'home' },
      create: { key: 'home', message: 'Hello API' },
      update: {},
    });

    return { message: greeting.message };
  }
}
