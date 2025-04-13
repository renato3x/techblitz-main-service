import { JwtSignOptions } from '@nestjs/jwt';
import { JwtTokenType } from '../enums/jwt-token-type.enum';

export type SignOptions = {
  [key in JwtTokenType]: JwtSignOptions;
};
