import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { PrismaService } from '@/common/services/prisma.service';
import { PasswordService } from '@/common/services/password.service';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtTokenService } from '@/jwt-token/services/jwt-token.service';
import { JwtTokenType } from '@/jwt-token/enums/jwt-token-type.enum';
import { CheckUsernameEmailDto } from './dto/check-username-email.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAccountRecoveryTokenDto } from './dto/create-account-recovery-token.dto';
import { DateTime } from 'luxon';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EventEmitter } from '@/event-emitter/interfaces/event-emitter.interface';
import { EVENT_EMITTER_SERVICE } from '@/event-emitter/event-emitter.constants';
import { DeleteUserDto } from './dto/delete-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(EVENT_EMITTER_SERVICE)
    private readonly eventEmitter: EventEmitter,
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    await this.throwErrorIfUserWithSameEmailAlreadyExists(registerUserDto.email);
    await this.throwErrorIfUserWithSameUsernameAlreadyExists(registerUserDto.username);

    const hash = this.passwordService.hash(registerUserDto.password);

    const user = await this.prisma.user.create({
      data: {
        ...registerUserDto,
        avatar_fallback: this.createAvatarFallback(registerUserDto.name),
        password: hash,
      },
      omit: {
        total_followers: true,
        total_following: true,
        bio: true,
        password: true,
        updated_at: true,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      scopes: [user.role],
    };

    const { token, expiresIn } = this.jwtTokenService.create(payload, JwtTokenType.APP);
    await this.eventEmitter.emit('user.registered', user);

    return { user, token, expiresIn };
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        ...(loginUserDto.username ? { username: loginUserDto.username } : {}),
        ...(loginUserDto.email ? { email: loginUserDto.email } : {}),
      },
      omit: {
        total_followers: true,
        total_following: true,
        bio: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValidPassword = this.passwordService.compare(loginUserDto.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Password is invalid');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      scopes: [user.role],
    };

    const { token, expiresIn } = this.jwtTokenService.create(payload, JwtTokenType.APP);
    const { password: _password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      expiresIn,
    };
  }

  async validate(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
      omit: {
        total_followers: true,
        total_following: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async checkUsernameOrEmail({ field, value }: CheckUsernameEmailDto) {
    const isValidEmail = /^\S.+@.+\..+/gm;

    if (field === 'email') {
      if (!isValidEmail.test(value)) {
        throw new BadRequestException('Informed email is not valid');
      }
    }

    const count = await this.prisma.user.count({
      where: {
        [field]: value,
      },
    });

    return {
      field,
      value,
      valid: count === 0,
    };
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
      omit: {
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.throwErrorIfUserWithSameEmailAlreadyExists(updateUserDto.email);
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      await this.throwErrorIfUserWithSameUsernameAlreadyExists(updateUserDto.username);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateUserDto,
        avatar_fallback: updateUserDto.name ? this.createAvatarFallback(updateUserDto.name) : undefined,
      },
      omit: {
        total_followers: true,
        total_following: true,
        password: true,
      },
    });

    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      scopes: [updatedUser.role],
    };

    const { token, expiresIn } = this.jwtTokenService.create(payload, JwtTokenType.APP);

    await this.eventEmitter.emit('user.updated', {
      email: updatedUser.email,
      username: updatedUser.username,
      updated_at: updatedUser.updated_at,
    });

    return { user: updatedUser, token, expiresIn };
  }

  async changePassword(userId: string, { old_password, new_password }: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOldPasswordEqualsFromCurrentPassword = this.passwordService.compare(old_password, user.password);

    if (!isOldPasswordEqualsFromCurrentPassword) {
      throw new ForbiddenException('Current password is incorrect');
    }

    if (new_password === old_password) {
      throw new ForbiddenException('New password must be different from current password');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: this.passwordService.hash(new_password),
      },
      select: {
        email: true,
        username: true,
        updated_at: true,
      },
    });

    await this.eventEmitter.emit('user.password-updated', updatedUser);
    return updatedUser;
  }

  async createAccountRecoveryToken({ email }: CreateAccountRecoveryTokenDto) {
    const expirationTimeInMinutes = +process.env.ACCOUNT_RECOVERY_TOKEN_TTL_IN_MINUTES;
    const user = await this.prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existentToken = await this.prisma.accountRecoveryToken.findFirst({
      where: {
        user_id: user.id,
      },
    });

    if (existentToken) {
      const now = DateTime.now();
      const expiresAt = DateTime.fromJSDate(existentToken.expires_at);
      const remainingMinutes = expiresAt.diff(now, 'minutes').minutes;
      const isTokenValid = remainingMinutes > 0;

      if (isTokenValid) {
        throw new BadRequestException('A valid recovery token already exists');
      }

      await this.prisma.accountRecoveryToken.delete({
        where: { id: existentToken.id },
      });
    }

    const expiresAt = DateTime.utc().plus({ minutes: expirationTimeInMinutes });
    const token = await this.prisma.accountRecoveryToken.create({
      data: {
        user_id: user.id,
        expires_at: expiresAt.toJSDate(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    await this.eventEmitter.emit('user.account-recovery', token);

    return { expiration_date_in_millis: expiresAt.toMillis() };
  }

  async resetPassword({ token, password }: ResetPasswordDto) {
    const accountRecoveryToken = await this.prisma.accountRecoveryToken.findFirst({
      where: {
        token,
      },
      include: {
        user: {
          select: {
            id: true,
            password: true,
          },
        },
      },
    });

    if (!accountRecoveryToken) {
      throw new BadRequestException('Token is not valid');
    }

    const expiresAt = DateTime.fromJSDate(accountRecoveryToken.expires_at);
    const now = DateTime.utc();
    const expirationTimeInMinutes = +process.env.ACCOUNT_RECOVERY_TOKEN_TTL_IN_MINUTES;
    const isTokenExpired = now.diff(expiresAt, 'minutes').minutes >= expirationTimeInMinutes;

    if (isTokenExpired) {
      await this.prisma.accountRecoveryToken.delete({
        where: { id: accountRecoveryToken.id },
      });

      throw new BadRequestException('Token has expired');
    }

    const isNewPasswordEqualFromCurrentPassword = this.passwordService.compare(
      password,
      accountRecoveryToken.user.password,
    );

    if (isNewPasswordEqualFromCurrentPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: accountRecoveryToken.user_id },
        data: {
          password: this.passwordService.hash(password),
        },
        select: {
          username: true,
          email: true,
          updated_at: true,
        },
      }),
      this.prisma.accountRecoveryToken.delete({
        where: { id: accountRecoveryToken.id },
      }),
    ]);

    await this.eventEmitter.emit('user.password-reset', user);
  }

  async createAccountDeletionCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existentCode = await this.prisma.accountDeletionCode.findFirst({
      where: {
        user_id: user.id,
      },
    });

    if (existentCode) {
      const now = DateTime.now();
      const expiresAt = DateTime.fromJSDate(existentCode.expires_at);
      const remainingMinutes = expiresAt.diff(now, 'minutes').minutes;
      const isCodeValid = remainingMinutes > 0;

      if (isCodeValid) {
        throw new BadRequestException('A valid deletion code already exists');
      }

      await this.prisma.accountDeletionCode.delete({
        where: { id: existentCode.id },
      });
    }

    const expirationTimeInMinutes = +process.env.ACCOUNT_DELETION_CODE_TTL_IN_MINUTES;
    const expiresAt = DateTime.utc().plus({ minutes: expirationTimeInMinutes });
    const code = await this.prisma.accountDeletionCode.create({
      data: {
        code: this.generateAccountDeletionCode(),
        user_id: user.id,
        expires_at: expiresAt.toJSDate(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    await this.eventEmitter.emit('user.deletion-request', code);

    return {
      expiration_date_in_millis: expiresAt.toMillis(),
    };
  }

  async deleteUser(userId: string, deleteUserDto: DeleteUserDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const deletionCode = await this.prisma.accountDeletionCode.findFirst({
      where: {
        user_id: user.id,
      },
    });

    if (!deletionCode) {
      throw new NotFoundException('Invalid deletion code');
    }

    if (deleteUserDto.code !== deletionCode.code) {
      throw new ForbiddenException('Invalid deletion code');
    }

    const expiresAt = DateTime.fromJSDate(deletionCode.expires_at);
    const now = DateTime.utc();
    const expirationTimeInMinutes = +process.env.ACCOUNT_DELETION_CODE_TTL_IN_MINUTES;
    const isCodeExpired = now.diff(expiresAt, 'minutes').minutes >= expirationTimeInMinutes;

    if (isCodeExpired) {
      await this.prisma.accountDeletionCode.delete({
        where: {
          id: deletionCode.id,
        },
      });

      throw new ForbiddenException('Code already expired');
    }

    await this.prisma.user.delete({
      where: {
        id: user.id,
      },
    });
  }

  generateAccountDeletionCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  private createAvatarFallback(name: string) {
    const names = name.trim().split(' ');

    if (names.length === 1) {
      return names[0][0].toUpperCase();
    }

    const first = names[0][0].toUpperCase();
    const last = names.at(-1)![0].toUpperCase();

    return first + last;
  }

  private async throwErrorIfUserWithSameUsernameAlreadyExists(username: string) {
    const userWithSameUsername = await this.prisma.user.findFirst({
      where: {
        username,
      },
    });

    if (userWithSameUsername) {
      throw new BadRequestException('Username already exists');
    }
  }

  private async throwErrorIfUserWithSameEmailAlreadyExists(email: string) {
    const userWithSameUsername = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (userWithSameUsername) {
      throw new BadRequestException('Email already exists');
    }
  }
}
