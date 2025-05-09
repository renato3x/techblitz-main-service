import { APP_LOGGER_SERVICE } from '@/app-logger/app-logger.constants';
import { AppLogger } from '@/app-logger/interfaces/app-logger.interface';
import { PrismaService } from '@/common/services/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DateTime } from 'luxon';

@Injectable()
export class AuthTasksService {
  constructor(
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: AppLogger,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async deleteExpiredAccountRecoveryTokens() {
    this.logger.info('Initiating deletion of expired account recovery tokens', { context: AuthTasksService.name });
    const minutes = +process.env.ACCOUNT_RECOVERY_TOKEN_TTL_IN_MINUTES;

    const tokens = await this.prisma.accountRecoveryToken.findMany({
      where: {
        expires_at: {
          lte: DateTime.utc().minus({ minutes }).toJSDate(),
        },
      },
      select: { id: true },
    });

    if (tokens.length === 0) {
      this.logger.info('No expired account recovery token to delete', { context: AuthTasksService.name });
      return;
    }

    this.logger.info(`Deleting ${tokens.length} expired account recovery tokens`, { context: AuthTasksService.name });
    await this.prisma.$transaction([
      this.prisma.accountRecoveryToken.deleteMany({
        where: {
          id: {
            in: tokens.map(({ id }) => id),
          },
        },
      }),
    ]);

    this.logger.info('All expired account recovery tokens was deleted successfully', {
      context: AuthTasksService.name,
    });
  }
}
