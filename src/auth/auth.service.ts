import {
  BadRequestException,
  ForbiddenException,
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

@Injectable()
export class AuthService {
  constructor(
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

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: this.passwordService.hash(new_password),
      },
    });
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
