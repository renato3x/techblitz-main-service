import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { StorageAuthService } from './storage-auth.service';
import { CreateStorageTokenDto } from './dto/create-storage-token.dto';
import { AuthGuard } from '@/common/guards/auth.guard';

@Controller('storage')
@UseGuards(AuthGuard)
export class StorageAuthController {
  constructor(private readonly storageAuthService: StorageAuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  createStorageToken(@Body() body: CreateStorageTokenDto) {
    return this.storageAuthService.createStorageToken(body);
  }
}
