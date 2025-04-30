import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const timestamp = new Date().toISOString();

        if (response.statusCode === 204) {
          return;
        }

        return {
          data,
          timestamp,
          status_code: response.statusCode,
        };
      }),
    );
  }
}
