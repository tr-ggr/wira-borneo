import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionGuard } from './auth-session.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthSessionGuard],
  exports: [AuthService, AuthSessionGuard],
})
export class AuthModule {}
