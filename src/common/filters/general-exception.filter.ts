import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch(Error)
export class GeneralExceptionFilter<T extends Error> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const timestamp = new Date().toISOString();
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(statusCode).json({
      message: 'Internal Server Error',
      statusCode,
      timestamp,
    });
  }
}
