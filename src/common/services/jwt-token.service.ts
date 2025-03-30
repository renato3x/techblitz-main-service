import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtTokenType } from '../enums/jwt-token-type.enum';

type SignOptions = {
  [key in JwtTokenType]: JwtSignOptions;
};

type Claims = {
  [key: string]: any;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
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
    expired: {
      expiresIn: '100',
      audience: 'client',
    },
  };

  constructor(private readonly jwt: JwtService) {}

  create(payload: object, type: JwtTokenType) {
    return this.jwt.sign(payload, { ...this.signOptions[type] });
  }

  decode(token: string) {
    return this.jwt.verify(token) as Claims;
  }

  getSignOptionAudience(jwtTokenType: JwtTokenType) {
    return this.signOptions[jwtTokenType].audience as string;
  }
}
