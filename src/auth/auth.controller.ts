import { Body, Controller, HttpStatus, Post, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { MessageQueueProducerService } from '@/common/services/message-queue-producer.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly messageQueueProducer: MessageQueueProducerService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserDto) {
    const { token, user } = await this.authService.register(body);
    await this.messageQueueProducer.emit('user.registered', user);

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
