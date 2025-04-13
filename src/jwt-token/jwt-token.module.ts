import { Global, Module } from '@nestjs/common';
import { JwtTokenService } from './services/jwt-token.service';

@Global()
@Module({
  providers: [JwtTokenService],
  exports: [JwtTokenService],
})
export class JwtTokenModule {}
