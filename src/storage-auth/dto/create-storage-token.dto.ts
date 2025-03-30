import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateStorageTokenSchema = z.object({
  type: z.enum(['avatars'], { required_error: 'Type is required', invalid_type_error: 'Type is invalid' }),
  context: z.enum(['upload', 'delete'], {
    required_error: 'Context is required',
    invalid_type_error: 'Context is invalid',
  }),
});

export class CreateStorageTokenDto extends createZodDto(CreateStorageTokenSchema) {}
