import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter<T extends HttpException> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const statusCode = exception.getStatus();
    const data = exception.getResponse();
    const timestamp = new Date().toISOString();

    response.status(statusCode).json({
      ...(typeof data === 'string' ? { message: data } : data),
      statusCode,
      timestamp,
    });
  }
}
