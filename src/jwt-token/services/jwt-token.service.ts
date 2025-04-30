import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenType } from '../enums/jwt-token-type.enum';
import { Claims } from '../types/claims.type';
import { SignOptions } from '../types/sign-options.type';
import ms from 'ms';

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
    const options = this.signOptions[type];
    const token = this.jwt.sign(payload, options);
    const expiresIn = ms(options.expiresIn as any) as unknown as number;

    return {
      token,
      expiresIn,
    };
  }

  decode(token: string) {
    return this.jwt.verify(token) as Claims;
  }

  getSignOptionAudience(jwtTokenType: JwtTokenType) {
    return this.signOptions[jwtTokenType].audience as string;
  }
}
