import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ZodValidationPipe } from 'nestjs-zod';

import { AuthModule } from '@/auth/auth.module';

import { CommonModule } from '@/common/common.module';
import { ZodValidationExceptionFilter } from '@/common/filters/zod-validation-exception.filter';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { GeneralExceptionFilter } from '@/common/filters/general-exception.filter';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CommonModule, AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: ZodValidationExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: GeneralExceptionFilter,
    },
  ],
})
export class AppModule {}
