import { DynamicModule, Global, Module } from '@nestjs/common';
import { eventEmitterProviders } from './event-emitter.providers';
import { EVENT_EMITTER_SERVICE } from './event-emitter.constants';

@Global()
@Module({})
export class EventEmitterModule {
  static forRoot(options: { provider: EventEmitter.EventEmitterProviderOptions }): DynamicModule {
    const eventEmitterService = eventEmitterProviders[options.provider];

    if (!eventEmitterService) {
      throw new Error('Event emitter provider not supported');
    }

    return {
      module: EventEmitterModule,
      providers: [
        {
          provide: EVENT_EMITTER_SERVICE,
          useClass: eventEmitterService,
        },
      ],
      exports: [EVENT_EMITTER_SERVICE],
    };
  }
}
