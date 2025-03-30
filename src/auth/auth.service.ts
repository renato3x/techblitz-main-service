import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { PrismaService } from '@/common/services/prisma.service';
import { PasswordService } from '@/common/services/password.service';
import { JwtTokenService } from '@/common/services/jwt-token.service';

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
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    const payload = { sub: user.id };
    const token = this.jwtTokenService.create(payload, '48h');

    return { token, user };
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
      throw new BadRequestException(`Email ${email} already registered`);
    }
  }
}
