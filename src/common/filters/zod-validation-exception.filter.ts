import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { Response } from 'express';

@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const statusCode = exception.getStatus();
    const errors = exception.getZodError().errors.map((error) => error.message);
    const timestamp = new Date().toISOString();

    response.status(statusCode).json({
      message: 'Validation error',
      statusCode,
      errors,
      timestamp,
    });
  }
}
