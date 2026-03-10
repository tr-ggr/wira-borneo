import { Module } from '@nestjs/common';
import { RiskIntelligenceModule } from './risk-intelligence/risk-intelligence.module';
import { FamiliesModule } from './families/families.module';
import { VolunteersModule } from './volunteers/volunteers.module';
import { HelpRequestsModule } from './help-requests/help-requests.module';
import { WarningsModule } from './warnings/warnings.module';
import { EvacuationModule } from './evacuation/evacuation.module';
import { AssistantModule } from './assistant/assistant.module';
import { AdminOperationsModule } from './admin-operations/admin-operations.module';
import { PinsModule } from './pins/pins.module';

@Module({
  imports: [
    RiskIntelligenceModule,
    FamiliesModule,
    VolunteersModule,
    HelpRequestsModule,
    WarningsModule,
    EvacuationModule,
    AssistantModule,
    AdminOperationsModule,
    PinsModule,
  ],
})
export class DisasterResponseModule {}
