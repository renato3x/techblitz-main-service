import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MessageQueueProducerService implements OnApplicationBootstrap {
  private client: ClientProxy;

  onApplicationBootstrap() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RMQ_PORT],
        queue: process.env.MESSAGE_BROKER_QUEUE_NAME,
        persistent: true,
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  async emit(pattern: string, data: any) {
    await firstValueFrom(this.client.emit(pattern, data));
  }
}
