import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  async register(registerUserDto: RegisterUserDto): Promise<void> {
    console.log(registerUserDto);
  }
}
