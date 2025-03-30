import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { PasswordService } from './services/password.service';
import { JwtTokenService } from './services/jwt-token.service';

@Global()
@Module({
  providers: [PrismaService, PasswordService, JwtTokenService],
  exports: [PrismaService, PasswordService, JwtTokenService],
})
export class CommonModule {}
