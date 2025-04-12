import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { PasswordService } from './services/password.service';
import { JwtTokenService } from './services/jwt-token.service';
import { MessageQueueProducerService } from './services/message-queue-producer.service';

@Global()
@Module({
  providers: [PrismaService, PasswordService, JwtTokenService, MessageQueueProducerService],
  exports: [PrismaService, PasswordService, JwtTokenService, MessageQueueProducerService],
})
export class CommonModule {}
