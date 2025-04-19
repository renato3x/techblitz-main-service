import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { PrismaService } from '@/common/services/prisma.service';
import { PasswordService } from '@/common/services/password.service';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtTokenService } from '@/jwt-token/services/jwt-token.service';
import { JwtTokenType } from '@/jwt-token/enums/jwt-token-type.enum';

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
        password: hash,
      },
      omit: {
        avatarUrl: true,
        bio: true,
        password: true,
        updatedAt: true,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const token = this.jwtTokenService.create(payload, JwtTokenType.APP);

    return { user, token };
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        ...(loginUserDto.username ? { username: loginUserDto.username } : {}),
        ...(loginUserDto.email ? { email: loginUserDto.email } : {}),
      },
      omit: {
        createdAt: true,
        updatedAt: true,
        avatarUrl: true,
        bio: true,
        name: true,
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
    };

    const token = this.jwtTokenService.create(payload, JwtTokenType.APP);

    return { token };
  }

  private async throwErrorIfUserWithSameUsernameAlreadyExists(username: string) {
    const userWithSameUsername = await this.prisma.user.findFirst({
      where: {
        username,
      },
    });

    if (userWithSameUsername) {
      throw new BadRequestException(`Username ${username} already exists`);
    }
  }

  private async throwErrorIfUserWithSameEmailAlreadyExists(email: string) {
    const userWithSameUsername = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (userWithSameUsername) {
      throw new BadRequestException(`Email ${email} already exists`);
    }
  }
}
