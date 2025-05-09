import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthTasksService } from './services/auth-tasks.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthTasksService],
})
export class AuthModule {}
