import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter } from '../interfaces/event-emitter.interface';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RmqEventEmitterService implements EventEmitter, OnApplicationBootstrap, OnApplicationShutdown {
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

  async onApplicationShutdown() {
    await this.client.close();
  }

  async emit<T = any>(pattern: string, payload: T) {
    await firstValueFrom(this.client.emit(pattern, payload));
  }
}
