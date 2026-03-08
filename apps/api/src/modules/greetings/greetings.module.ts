import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GreetingsController } from './greetings.controller';
import { GreetingsService } from './greetings.service';
import { GreetingsRepository } from './repositories/greetings.repository';

@Module({
  imports: [AuthModule],
  controllers: [GreetingsController],
  providers: [GreetingsService, GreetingsRepository],
  exports: [GreetingsService],
})
export class GreetingsModule {}
