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
import { StorageAuthModule } from './storage-auth/storage-auth.module';
import { JwtTokenModule } from './jwt-token/jwt-token.module';
import { AppLoggerModule } from './app-logger/app-logger.module';
import { EventEmitterModule } from './event-emitter/event-emitter.module';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        issuer: process.env.JWT_ISSUER,
      },
    }),
    AppLoggerModule.forRoot({ provider: process.env.APP_LOGGER_PROVIDER }),
    EventEmitterModule.forRoot({ provider: process.env.EVENT_EMITTER_PROVIDER }),
    CommonModule,
    AuthModule,
    StorageAuthModule,
    JwtTokenModule,
    UsersModule,
    ScheduleModule.forRoot(),
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
