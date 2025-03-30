import { Module } from '@nestjs/common';
import { StorageAuthService } from './storage-auth.service';
import { StorageAuthController } from './storage-auth.controller';

@Module({
  controllers: [StorageAuthController],
  providers: [StorageAuthService],
})
export class StorageAuthModule {}
