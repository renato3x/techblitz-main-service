import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CheckUsernameEmailSchema = z.object({
  field: z.enum(['username', 'email'], { required_error: '"field" is required' }),
  value: z.string({ required_error: '"value" is required' }).trim().nonempty('"value" is required'),
});

export class CheckUsernameEmailDto extends createZodDto(CheckUsernameEmailSchema) {}
