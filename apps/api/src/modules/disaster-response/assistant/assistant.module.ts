import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AssistantController } from './assistant.controller';
import { AssistantInternalController } from './assistant-internal.controller';
import { AssistantService } from './assistant.service';
import { SimpleAssistantProvider } from './simple-assistant.provider';
import { FlaskAssistantProvider } from './flask-assistant.provider';

@Module({
  imports: [AuthModule],
  controllers: [AssistantController, AssistantInternalController],
  providers: [
    AssistantService,
    SimpleAssistantProvider,
    {
      provide: 'DisasterAssistantProvider',
      useClass: FlaskAssistantProvider,
    },
  ],
  exports: [AssistantService],
})
export class AssistantModule { }
