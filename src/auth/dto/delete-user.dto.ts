import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const DeleteUserSchema = z.object({
  code: z
    .string({ message: '"code" is required' })
    .min(5, '"code" must have 5 numbers')
    .max(5, '"code" must have 5 numbers')
    .refine((value) => !isNaN(Number(value)), {
      message: '"code" must be numeric',
    }),
});

export class DeleteUserDto extends createZodDto(DeleteUserSchema) {}
