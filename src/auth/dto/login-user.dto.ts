import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const LoginUserSchema = z.object({
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
    })
    .optional(),
  email: z.string({ message: '"email" is required' }).email({ message: '"email" is required' }).optional(),
  password: z
    .string({ message: '"password" is required' })
    .trim()
    .nonempty('"password" is required')
    .min(8, { message: '"password" must have at least 8 characters' }),
});

export class LoginUserDto extends createZodDto(LoginUserSchema) {}
