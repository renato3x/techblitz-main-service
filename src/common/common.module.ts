import { Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { PasswordService } from './services/password.service';
import { JwtTokenService } from './services/jwt-token.service';

@Module({
  providers: [PrismaService, PasswordService, JwtTokenService],
  exports: [PrismaService, PasswordService, JwtTokenService],
})
export class CommonModule {}
