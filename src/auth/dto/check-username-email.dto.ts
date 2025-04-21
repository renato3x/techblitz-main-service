import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CheckUsernameEmailSchema = z.object({
  field: z.enum(['username', 'email'], { required_error: 'Field is required' }),
  value: z.string({ required_error: 'Value is required' }).trim().nonempty('Value is required'),
});

export class CheckUsernameEmailDto extends createZodDto(CheckUsernameEmailSchema) {}
