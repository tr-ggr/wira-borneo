import { Module } from '@nestjs/common';
import { HealthOutbreakController } from './health-outbreak.controller';
import { HealthOutbreakService } from './health-outbreak.service';

@Module({
  controllers: [HealthOutbreakController],
  providers: [HealthOutbreakService],
  exports: [HealthOutbreakService],
})
export class HealthOutbreakModule {}
