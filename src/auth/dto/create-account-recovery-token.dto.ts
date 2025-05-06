import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateAccountRecoveryTokenSchema = z.object({
  email: z.string({ message: '"email" is required' }).email({ message: '"email" is required' }),
});

export class CreateAccountRecoveryTokenDto extends createZodDto(CreateAccountRecoveryTokenSchema) {}
