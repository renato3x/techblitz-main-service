import { Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { PasswordService } from './services/password.service';
import { JwtTokenService } from './services/jwt-token.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [PrismaService, PasswordService, JwtTokenService],
  exports: [PrismaService, PasswordService, JwtTokenService],
})
export class CommonModule {}
