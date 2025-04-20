import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

@Catch(Error)
export class ExceptionHandlerFilter<T extends Error> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const timestamp = new Date().toISOString();

    if (exception instanceof ZodValidationException) {
      const statusCode = exception.getStatus();
      const errors = exception.getZodError().errors.map((error) => error.message);

      response.status(statusCode).json({
        message: 'Validation error',
        status_code: statusCode,
        errors,
        timestamp,
      });

      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const data = exception.getResponse();

      response.status(statusCode).json({
        ...(typeof data === 'string' ? { message: data } : data),
        statusCode: undefined,
        status_code: statusCode,
        timestamp,
      });

      return;
    }

    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(statusCode).json({
      message: 'Internal server error',
      status_code: statusCode,
      timestamp,
    });
  }
}
