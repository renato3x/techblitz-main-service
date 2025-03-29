import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterUserSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .nonempty('Name cannot be empty')
    .max(50, 'Name is too long')
    .regex(/^[^0-9]*$/, { message: 'Name cannot contain numbers' }),
  password: z
    .string({ message: 'Password is required' })
    .trim()
    .nonempty('Password cannot be empty')
    .min(8, { message: 'Password must have at least 8 characters' }),
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
    }),
  bio: z
    .string()
    .trim()
    .nonempty('Bio cannot be empty')
    .max(100, { message: 'Bio must have a maximum of 100 characters' })
    .optional(),
  email: z.string({ message: 'Email is required' }).email({ message: 'Email is invalid' }),
});

export class RegisterUserDto extends createZodDto(RegisterUserSchema) {}
