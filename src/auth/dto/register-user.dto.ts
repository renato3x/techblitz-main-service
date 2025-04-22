import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterUserSchema = z.object({
  name: z
    .string({ message: '"name" is required' })
    .trim()
    .nonempty('"name" is required')
    .max(50, '"name" is too long')
    .regex(/^[^0-9]*$/, { message: '"name" cannot contain numbers' }),
  password: z
    .string({ message: '"password" is required' })
    .trim()
    .nonempty('"password" is required')
    .min(8, { message: '"password" must have at least 8 characters' }),
  username: z
    .string({ message: '"username" is required' })
    .trim()
    .nonempty('"username" is required')
    .refine((val) => !/^\d+$/.test(val), {
      message: '"username" cannot consist of only numbers',
    })
    .refine((val) => /^[a-zA-Z0-9._]+$/.test(val), {
      message: '"username" can only contain letters, numbers, dots, and underscores',
    })
    .refine((val) => !/\.\./.test(val), {
      message: '"username" cannot contain consecutive dots',
    })
    .refine((val) => !/^[.]+$/.test(val), {
      message: '"username" cannot consist of only dots',
    })
    .refine((val) => !/^_+$/.test(val), {
      message: '"username" cannot consist of only underscores',
    }),
  email: z.string({ message: '"email" is required' }).email({ message: '"email" is required' }),
});

export class RegisterUserDto extends createZodDto(RegisterUserSchema) {}
