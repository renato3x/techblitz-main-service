import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const ChangePasswordSchema = z.object({
  old_password: z
    .string({ message: '"old_password" is required' })
    .trim()
    .nonempty('"old_password" is required')
    .min(8, { message: '"old_password" must have at least 8 characters' }),
  new_password: z
    .string({ message: '"new_password" is required' })
    .trim()
    .nonempty('"new_password" is required')
    .min(8, { message: '"new_password" must have at least 8 characters' }),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
