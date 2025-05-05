import { Body, Controller, HttpStatus, Post, HttpCode, Inject, Get, Query, Res, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { EVENT_EMITTER_SERVICE } from '@/event-emitter/event-emitter.constants';
import { EventEmitter } from '@/event-emitter/interfaces/event-emitter.interface';
import { CheckUsernameEmailDto } from './dto/check-username-email.dto';
import { Request, Response } from 'express';
import { AuthGuard } from '@/common/guards/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

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
    const { user, token, expiresIn } = await this.authService.register(body);
    await this.eventEmitter.emit('user.registered', user);

    response.cookie(process.env.AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expiresIn,
      path: '/',
    });

    return { user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginUserDto, @Res({ passthrough: true }) response: Response) {
    const { user, token, expiresIn } = await this.authService.login(body);

    response.cookie(process.env.AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expiresIn,
      path: '/',
    });

    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(process.env.AUTH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return;
  }

  @Get('user')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async validate(@Req() request: Request) {
    const userId = request.userToken!.sub;
    return await this.authService.validate(userId);
  }

  @Post('user')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Req() request: Request, @Res({ passthrough: true }) response: Response, @Body() body: UpdateUserDto) {
    const userId = request.userToken!.sub;
    const { user, token, expiresIn } = await this.authService.update(userId, body);

    response.cookie(process.env.AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expiresIn,
      path: '/',
    });

    return user;
  }

  @Get('check')
  @HttpCode(HttpStatus.OK)
  async checkUsernameOrEmail(@Query() query: CheckUsernameEmailDto) {
    return await this.authService.checkUsernameOrEmail(query);
  }
}
