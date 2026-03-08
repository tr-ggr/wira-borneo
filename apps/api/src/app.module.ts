import { Module } from '@nestjs/common';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { DisasterResponseModule } from './modules/disaster-response/disaster-response.module';
import { OpenMeteoModule } from './providers/open-meteo/open-meteo.module';


@Module({
  imports: [DatabaseModule, AuthModule, OpenMeteoModule, DisasterResponseModule],
})
export class AppModule {}
