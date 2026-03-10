import { Module } from '@nestjs/common';
import { TrackerController } from './tracker.controller';
import { TrackerService } from './tracker.service';
import { DatabaseModule } from '../../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TrackerController],
  providers: [TrackerService],
  exports: [TrackerService],
})
export class TrackerModule {}
