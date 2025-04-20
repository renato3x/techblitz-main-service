import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { PasswordService } from './services/password.service';

@Global()
@Module({
  providers: [PrismaService, PasswordService],
  exports: [PrismaService, PasswordService],
})
export class CommonModule {}
