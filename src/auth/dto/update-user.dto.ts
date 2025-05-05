import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const UpdateUserSchema = z.object({
  email: z
    .string({ message: '"email" is required' })
    .email({ message: '"email" is required' })
    .optional()
    .transform((value) => value?.trim()),
  name: z
    .string({ message: '"name" is required' })
    .trim()
    .nonempty('"name" is required')
    .max(50, '"name" is too long')
    .regex(/^[^0-9]*$/, { message: '"name" cannot contain numbers' })
    .optional()
    .transform((value) => value?.trim()),
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
    .optional()
    .transform((value) => value?.trim()),
  bio: z
    .string()
    .trim()
    .optional()
    .transform((value) => value?.trim()),
  avatar_url: z.string().url('"avatar_url" must be an url').optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
