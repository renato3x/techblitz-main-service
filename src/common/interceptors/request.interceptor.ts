import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { APP_LOGGER_SERVICE } from '@/app-logger/app-logger.constants';
import { AppLogger } from '@/app-logger/interfaces/app-logger.interface';

@Injectable()
export class RequestInterceptor implements NestInterceptor {
  constructor(
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: AppLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();

    this.logger.info(`Handling ${request.method} ${request.url} from ${request.headers.origin || 'NOT_INFORMED'}`, {
      context: RequestInterceptor.name,
      meta: {
        method: request.method,
        url: request.url,
        body: {
          ...request.body,
          password: undefined,
        },
        headers: {
          ...request.headers,
          authorization: undefined,
        },
      },
    });

    return next.handle();
  }
}
