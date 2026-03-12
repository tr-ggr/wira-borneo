import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../core/database/database.module';
import { SupabaseModule } from '../../../providers/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { DamageAnalysisService } from './damage-analysis.service';
import { DamageReportsController } from './damage-reports.controller';
import { DamageReportsService } from './damage-reports.service';

@Module({
  imports: [DatabaseModule, AuthModule, SupabaseModule],
  controllers: [DamageReportsController],
  providers: [DamageReportsService, DamageAnalysisService],
  exports: [DamageReportsService],
})
export class DamageReportsModule {}