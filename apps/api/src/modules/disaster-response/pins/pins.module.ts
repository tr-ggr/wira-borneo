import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../core/database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { PinsController } from './pins.controller';
import { PinTriageService } from './pin-triage.service';
import { PinsService } from './pins.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PinsController],
  providers: [PinsService, PinTriageService],
  exports: [PinsService],
})
export class PinsModule {}
