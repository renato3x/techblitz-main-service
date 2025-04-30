import { Injectable } from '@nestjs/common';
import { CreateStorageTokenDto } from './dto/create-storage-token.dto';
import { JwtTokenService } from '@/jwt-token/services/jwt-token.service';
import { JwtTokenType } from '@/jwt-token/enums/jwt-token-type.enum';

@Injectable()
export class StorageAuthService {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  createStorageToken(createStorageTokenDto: CreateStorageTokenDto) {
    const payload = {
      scope: `${createStorageTokenDto.type}:${createStorageTokenDto.context}`,
    };

    return this.jwtTokenService.create(payload, JwtTokenType.STORAGE);
  }
}
