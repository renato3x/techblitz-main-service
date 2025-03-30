import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const LoginUserSchema = z.object({
  username: z
    .string({ message: 'Username is required' })
    .trim()
    .nonempty('Username cannot be empty')
    .refine((val) => !/^\d+$/.test(val), {
      message: 'Username cannot consist of only numbers',
    })
    .refine((val) => /^[a-zA-Z0-9._]+$/.test(val), {
      message: 'Username can only contain letters, numbers, dots, and underscores',
    })
    .refine((val) => !/\.\./.test(val), {
      message: 'Username cannot contain consecutive dots',
    })
    .refine((val) => !/^[.]+$/.test(val), {
      message: 'Username cannot consist of only dots',
    })
    .refine((val) => !/^_+$/.test(val), {
      message: 'Username cannot consist of only underscores',
    })
    .optional(),
  email: z.string({ message: 'Email is required' }).email({ message: 'Email is invalid' }).optional(),
  password: z
    .string({ message: 'Password is required' })
    .trim()
    .nonempty('Password cannot be empty')
    .min(8, { message: 'Password must have at least 8 characters' }),
});

export class LoginUserDto extends createZodDto(LoginUserSchema) {}
