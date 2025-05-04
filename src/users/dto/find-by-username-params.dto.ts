import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const FindByUsernameParamsSchema = z.object({
  username: z.string({ required_error: '"username" is required' }).trim().nonempty('"username" is required'),
});

export class FindFindByUsernameParamsDto extends createZodDto(FindByUsernameParamsSchema) {}
