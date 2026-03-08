import { Module } from '@nestjs/common';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { GreetingsModule } from './modules/greetings/greetings.module';
import { OpenMeteoModule } from './providers/open-meteo/open-meteo.module';

@Module({
  imports: [DatabaseModule, AuthModule, GreetingsModule, OpenMeteoModule],
})
export class AppModule {}
