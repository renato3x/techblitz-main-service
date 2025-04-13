import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { PasswordService } from './services/password.service';
import { MessageQueueProducerService } from './services/message-queue-producer.service';

@Global()
@Module({
  providers: [PrismaService, PasswordService, MessageQueueProducerService],
  exports: [PrismaService, PasswordService, MessageQueueProducerService],
})
export class CommonModule {}
