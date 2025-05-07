import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const ResetPasswordSchema = z.object({
  token: z.string({ message: '"token" is required' }).uuid('"token" must be an uuid'),
  password: z
    .string({ message: '"password" is required' })
    .trim()
    .nonempty('"password" is required')
    .min(8, { message: '"password" must have at least 8 characters' }),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
