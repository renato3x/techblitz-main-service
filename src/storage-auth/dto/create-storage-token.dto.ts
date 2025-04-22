import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateStorageTokenSchema = z.object({
  type: z.enum(['avatars'], { required_error: '"type" is required' }),
  context: z.enum(['upload', 'delete'], { required_error: '"context" is required' }),
});

export class CreateStorageTokenDto extends createZodDto(CreateStorageTokenSchema) {}
