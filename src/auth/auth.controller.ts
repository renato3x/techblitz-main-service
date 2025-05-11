import {
  Body,
  Controller,
  HttpStatus,
  Post,
  HttpCode,
  Get,
  Query,
  Res,
  UseGuards,
  Req,
  Patch,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { CheckUsernameEmailDto } from './dto/check-username-email.dto';
import { Request, Response } from 'express';
import { AuthGuard } from '@/common/guards/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAccountRecoveryTokenDto } from './dto/create-account-recovery-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserDto, @Res({ passthrough: true }) response: Response) {
    const { user, token, expiresIn } = await this.authService.register(body);

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

  @Patch('user')
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

  @Delete('user')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() request: Request, @Res({ passthrough: true }) response: Response, @Body() body: DeleteUserDto) {
    const userId = request.userToken!.sub;

    await this.authService.deleteUser(userId, body);
    response.clearCookie(process.env.AUTH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return;
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Req() request: Request, @Body() body: ChangePasswordDto) {
    const userId = request.userToken!.sub;
    await this.authService.changePassword(userId, body);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.CREATED)
  async createAccountRecoveryToken(@Body() body: CreateAccountRecoveryTokenDto) {
    const { expiration_date_in_millis } = await this.authService.createAccountRecoveryToken(body);
    return { expiration_date_in_millis };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body);
  }

  @Get('check')
  @HttpCode(HttpStatus.OK)
  async checkUsernameOrEmail(@Query() query: CheckUsernameEmailDto) {
    return await this.authService.checkUsernameOrEmail(query);
  }

  @Post('account-deletion-request')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createAccountDeletionCode(@Req() request: Request) {
    const userId = request.userToken!.sub;
    const { expiration_date_in_millis } = await this.authService.createAccountDeletionCode(userId);
    return { expiration_date_in_millis };
  }
}
