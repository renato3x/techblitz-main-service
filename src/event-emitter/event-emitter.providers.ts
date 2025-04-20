import { Type } from '@nestjs/common';
import { EventEmitter } from './interfaces/event-emitter.interface';
import { RmqEventEmitterService } from './services/rmq-event-emitter.service';

export const eventEmitterProviders: Record<EventEmitter.EventEmitterProviderOptions, Type<EventEmitter>> = {
  rmq: RmqEventEmitterService,
};
