import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { FindFindByUsernameParamsDto } from './dto/find-by-username-params.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  async findByUsername(@Param() params: FindFindByUsernameParamsDto) {
    return await this.usersService.findByUsername(params.username);
  }
}
