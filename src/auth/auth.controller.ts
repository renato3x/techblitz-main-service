import { Body, Controller, HttpStatus, Post, HttpCode, Inject, Get, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { EVENT_EMITTER_SERVICE } from '@/event-emitter/event-emitter.constants';
import { EventEmitter } from '@/event-emitter/interfaces/event-emitter.interface';
import { CheckUsernameEmailDto } from './dto/check-username-email.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(EVENT_EMITTER_SERVICE)
    private readonly eventEmitter: EventEmitter,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserDto, @Res({ passthrough: true }) response: Response) {
    const { token, user } = await this.authService.register(body);
    await this.eventEmitter.emit('user.registered', user);

    response.cookie(process.env.AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.NO_CONTENT)
  async login(@Body() body: LoginUserDto, @Res({ passthrough: true }) response: Response) {
    const { token } = await this.authService.login(body);

    response.cookie(process.env.AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 2,
    });

    return;
  }

  @Get('check')
  @HttpCode(HttpStatus.OK)
  async checkUsernameOrEmail(@Query() query: CheckUsernameEmailDto) {
    return await this.authService.checkUsernameOrEmail(query);
  }
}
