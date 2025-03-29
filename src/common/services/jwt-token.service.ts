import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwt: JwtService) {}

  create(payload: object, expiresIn: string) {
    return this.jwt.sign(payload, { expiresIn });
  }
}
