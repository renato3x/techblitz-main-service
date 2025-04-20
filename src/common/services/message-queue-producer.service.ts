import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import amqplib from 'amqplib';

@Injectable()
export class MessageQueueProducerService implements OnApplicationBootstrap {
  private client: ClientProxy;

  async onApplicationBootstrap() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.BROKER_URL],
        queue: process.env.QUEUE_NAME,
        persistent: true,
        queueOptions: {
          durable: true,
        },
      },
    });

    await this.defineHelperQueues();
  }

  async emit(pattern: string, data: any) {
    await firstValueFrom(this.client.emit(pattern, data));
  }

  private async defineHelperQueues() {
    const connection = await amqplib.connect(process.env.BROKER_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(process.env.RETRY_QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-message-ttl': +process.env.RETRY_TIMEOUT,
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': process.env.QUEUE_NAME,
      },
    });

    await channel.assertQueue(process.env.DEAD_LETTER_QUEUE_NAME, { durable: true });
    await connection.close();
  }
}
