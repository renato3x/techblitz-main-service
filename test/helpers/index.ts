import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import { StartedTestContainer } from 'testcontainers';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { PasswordService } from '@/common/services/password.service';
import { DateTime } from 'luxon';

export async function createDatabaseContainer() {
  const container = await new PostgreSqlContainer('postgres').start();
  const connectionUri = container.getConnectionUri();
  process.env.DATABASE_URL = connectionUri;

  execSync('pnpm db:push', {
    env: {
      ...process.env,
      DATABASE_URL: connectionUri,
    },
  });

  return container as StartedTestContainer;
}

export async function createMessageBrokerContainer() {
  const container = await new RabbitMQContainer('rabbitmq:management').start();
  const amqpUrl = container.getAmqpUrl();
  process.env.BROKER_URL = amqpUrl;

  return container as StartedTestContainer;
}

export async function createContainers() {
  const containers: StartedTestContainer[] = [];

  containers.push(await createDatabaseContainer());
  containers.push(await createMessageBrokerContainer());

  return containers;
}

export async function closeContainers(containers: StartedTestContainer[]) {
  await Promise.all(
    containers.map(async (container, index) => {
      await container.stop();
      containers.splice(index, 1);
    }),
  );
}

export async function createUser(prisma: PrismaClient, passwordService: PasswordService) {
  const user = {
    name: faker.person.firstName(),
    username: faker.internet.username().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 20 }),
    avatar_fallback: 'TU',
  };

  const { role, id } = await prisma.user.create({
    data: {
      ...user,
      password: passwordService.hash(user.password),
    },
  });

  return { ...user, role, id };
}

export async function createAccountRecoveryToken(prisma: PrismaClient, userId: string) {
  const expirationTimeInMinutes = +process.env.ACCOUNT_RECOVERY_TOKEN_TTL_IN_MINUTES;

  const token = await prisma.accountRecoveryToken.create({
    data: {
      user_id: userId,
      expires_at: DateTime.utc().plus({ minutes: expirationTimeInMinutes }).toJSDate(),
    },
  });

  return token.token;
}
