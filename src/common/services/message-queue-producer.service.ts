import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

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
  }

  async emit(pattern: string, data: any) {
    await firstValueFrom(this.client.emit(pattern, data));
  }
}
