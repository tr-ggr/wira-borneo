import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../core/database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { DisasterPolicyService } from '../shared/disaster-policy.service';
import { ApprovedVolunteerGuard } from '../shared/approved-volunteer.guard';
import { HelpRequestsController } from './help-requests.controller';
import { HelpRequestTriageService } from './help-request-triage.service';
import { HelpRequestsService } from './help-requests.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [HelpRequestsController],
  providers: [
    HelpRequestsService,
    HelpRequestTriageService,
    DisasterPolicyService,
    ApprovedVolunteerGuard,
  ],
  exports: [HelpRequestsService],
})
export class HelpRequestsModule {}
