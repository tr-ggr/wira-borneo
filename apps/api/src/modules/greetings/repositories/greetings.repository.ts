import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/database.service';

@Injectable()
export class GreetingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeGreeting(): Promise<{ key: string; message: string }> {
    return this.prisma.greeting.upsert({
      where: { key: 'home' },
      create: { key: 'home', message: 'Hello API' },
      update: {},
      select: {
        key: true,
        message: true,
      },
    });
  }
}
