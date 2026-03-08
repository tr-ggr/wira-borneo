import { Injectable } from '@nestjs/common';
import { GreetingsRepository } from './repositories/greetings.repository';

@Injectable()
export class GreetingsService {
  constructor(private readonly greetingsRepository: GreetingsRepository) {}

  async getData(): Promise<{ message: string }> {
    const greeting = await this.greetingsRepository.getHomeGreeting();

    return { message: greeting.message };
  }
}
