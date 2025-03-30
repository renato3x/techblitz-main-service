import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ZodValidationPipe } from 'nestjs-zod';

import { AuthModule } from '@/auth/auth.module';

import { CommonModule } from '@/common/common.module';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { ExceptionHandlerFilter } from '@/common/filters/exception-handler.filter';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        issuer: process.env.JWT_ISSUER,
      },
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionHandlerFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
