import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterUserSchema = z.object({
  name: z
    .string({ message: 'name is required' })
    .trim()
    .nonempty('name cannot be empty')
    .regex(/^[A-Za-zÀ-ÿ\s'-]+$/, { message: 'name cannot contain special characters' }),
  password: z
    .string({ message: 'password is required' })
    .trim()
    .nonempty('password cannot be empty')
    .min(8, { message: 'password must have at least 8 characters' }),
  username: z
    .string({ message: 'username is required' })
    .trim()
    .nonempty('username cannot be empty')
    .refine((val) => !/^\d+$/.test(val), {
      message: 'username cannot consist of only numbers',
    })
    .refine((val) => /^[a-zA-Z0-9._]+$/.test(val), {
      message: 'username can only contain letters, numbers, dots, and underscores',
    })
    .refine((val) => !/\.\./.test(val), {
      message: 'username cannot contain consecutive dots',
    })
    .refine((val) => !/^[.]+$/.test(val), {
      message: 'username cannot consist of only dots',
    })
    .refine((val) => !/^_+$/.test(val), {
      message: 'username cannot consist of only underscores',
    }),
  bio: z
    .string()
    .trim()
    .nonempty('bio cannot be empty')
    .max(100, { message: 'bio must have a maximum of 100 characters' })
    .optional(),
  email: z.string({ message: 'email is required' }).email({ message: 'email is invalid' }),
  avatarUrl: z.string().url('avatarUrl must be an url').optional(),
});

export class RegisterUserDto extends createZodDto(RegisterUserSchema) {}
