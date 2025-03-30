import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtTokenType } from '../enums/jwt-token-type.enum';

type SignOptions = {
  [key in JwtTokenType]: JwtSignOptions;
};

@Injectable()
export class JwtTokenService {
  private signOptions: SignOptions = {
    app: {
      expiresIn: '2h',
      audience: 'client',
    },
    storage: {
      expiresIn: '2m',
      audience: 'storage',
    },
  };

  constructor(private readonly jwt: JwtService) {}

  create(payload: object, type: JwtTokenType) {
    return this.jwt.sign(payload, {
      issuer: process.env.JWT_ISSUER,
      ...this.signOptions[type],
    });
  }
}
