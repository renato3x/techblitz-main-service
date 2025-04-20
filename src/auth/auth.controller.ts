import { Body, Controller, HttpStatus, Post, HttpCode, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { EVENT_EMITTER_SERVICE } from '@/event-emitter/event-emitter.constants';
import { EventEmitter } from '@/event-emitter/interfaces/event-emitter.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(EVENT_EMITTER_SERVICE)
    private readonly eventEmitter: EventEmitter,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserDto) {
    const { token, user } = await this.authService.register(body);
    await this.eventEmitter.emit('user.registered', user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginUserDto) {
    const response = await this.authService.login(body);
    return response;
  }
}
