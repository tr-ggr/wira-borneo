import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../core/database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { RiskIntelligenceModule } from '../risk-intelligence/risk-intelligence.module';
import { OpenMeteoModule } from '../../../providers/open-meteo/open-meteo.module';
import { AssistantModule } from '../assistant/assistant.module';
import { AdminRoleGuard } from '../shared/admin-role.guard';
import { DisasterPolicyService } from '../shared/disaster-policy.service';
import { AdminOperationsController } from './admin-operations.controller';
import { AdminOperationsService } from './admin-operations.service';

@Module({
  imports: [DatabaseModule, AuthModule, RiskIntelligenceModule, OpenMeteoModule, AssistantModule],
  controllers: [AdminOperationsController],
  providers: [AdminOperationsService, DisasterPolicyService, AdminRoleGuard],
  exports: [AdminOperationsService],
})
export class AdminOperationsModule { }
