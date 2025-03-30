import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { StorageAuthService } from './storage-auth.service';
import { CreateStorageTokenDto } from './dto/create-storage-token.dto';

@Controller('storage')
export class StorageAuthController {
  constructor(private readonly storageAuthService: StorageAuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  createStorageToken(@Body() body: CreateStorageTokenDto) {
    return this.storageAuthService.createStorageToken(body);
  }
}
