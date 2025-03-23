import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';

@Injectable()
export class JwtTokenService {
  create(payload: object) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '48h' });
  }
}
