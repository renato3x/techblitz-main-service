import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { StorageAuthService } from './storage-auth.service';
import { CreateStorageTokenDto } from './dto/create-storage-token.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { Response } from 'express';

@Controller('storage')
@UseGuards(AuthGuard)
export class StorageAuthController {
  constructor(private readonly storageAuthService: StorageAuthService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  createStorageToken(@Body() body: CreateStorageTokenDto, @Res({ passthrough: true }) response: Response) {
    const { token, expiresIn } = this.storageAuthService.createStorageToken(body);
    response.cookie(process.env.STORAGE_AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: expiresIn,
    });
  }
}
