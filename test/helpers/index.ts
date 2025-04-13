import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import { execSync } from 'child_process';

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
}

export async function createMessageBrokerContainer() {
  const container = await new RabbitMQContainer('rabbitmq:management').start();
  const amqpUrl = container.getAmqpUrl();
  process.env.RMQ_URL = amqpUrl;
}

export async function createContainers() {
  await createDatabaseContainer();
  await createMessageBrokerContainer();
}
