import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import { StartedTestContainer } from 'testcontainers';
import { execSync } from 'child_process';

const containers: StartedTestContainer[] = [];

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

  containers.push(container);
}

export async function createMessageBrokerContainer() {
  const container = await new RabbitMQContainer('rabbitmq:management').start();
  const amqpUrl = container.getAmqpUrl();
  process.env.BROKER_URL = amqpUrl;
  containers.push(container);
}

export async function createContainers() {
  await createDatabaseContainer();
  await createMessageBrokerContainer();
}

export async function closeContainers() {
  await Promise.all(
    containers.map(async (container, index) => {
      await container.stop();
      containers.splice(index, 1);
    }),
  );
}
