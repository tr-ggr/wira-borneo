import { Module } from '@nestjs/common';
import { OpenMeteoService } from './open-meteo.service';

@Module({
  providers: [OpenMeteoService],
  exports: [OpenMeteoService],
})
export class OpenMeteoModule {}
