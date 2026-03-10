import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../core/database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { RoutingModule } from '../../routing/routing.module';
import { EvacuationController } from './evacuation.controller';
import { EvacuationService } from './evacuation.service';
import { SimpleRoutingProvider } from './simple-routing.provider';

@Module({
  imports: [DatabaseModule, AuthModule, RoutingModule],
  controllers: [EvacuationController],
  providers: [EvacuationService, SimpleRoutingProvider],
  exports: [EvacuationService],
})
export class EvacuationModule {}
