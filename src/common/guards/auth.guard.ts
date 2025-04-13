import { CanActivate, ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { JwtTokenType } from '@/jwt-token/enums/jwt-token-type.enum';
import { JwtTokenService } from '@/jwt-token/services/jwt-token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();

    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Access token is missing');
    }

    const token = authorization.substring(7);
    const unauthorizedException = new UnauthorizedException('Access token is invalid');

    try {
      const decoded = this.jwtTokenService.decode(token);
      const appAudience = this.jwtTokenService.getSignOptionAudience(JwtTokenType.APP);

      if (decoded.aud !== appAudience) {
        throw unauthorizedException;
      }

      if (decoded.iss !== process.env.JWT_ISSUER) {
        throw unauthorizedException;
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw unauthorizedException;
    }

    return true;
  }
}
