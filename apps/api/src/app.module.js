'use strict';
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return (c > 3 && r && Object.defineProperty(target, key, r), r);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.AppModule = void 0;
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const schedule_1 = require('@nestjs/schedule');
const event_emitter_1 = require('@nestjs/event-emitter');
const throttler_1 = require('@nestjs/throttler');
const core_1 = require('@nestjs/core');
const nestjs_1 = require('@node-idempotency/nestjs');
let AppModule = class AppModule {};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [
        config_1.ConfigModule.forRoot({
          isGlobal: true,
        }),
        schedule_1.ScheduleModule.forRoot(),
        throttler_1.ThrottlerModule.forRootAsync({
          imports: [config_1.ConfigModule],
          inject: [config_1.ConfigService],
        }),
        event_emitter_1.EventEmitterModule.forRoot({
          wildcard: false,
          delimiter: '.',
          newListener: false,
          removeListener: false,
          maxListeners: 10,
          verboseMemoryLeak: false,
          ignoreErrors: false,
        }),
        nestjs_1.NodeIdempotencyModule.forRootAsync({
          imports: [config_1.ConfigModule],
          inject: [config_1.ConfigService],
          useFactory: async (configService) => ({
            storage: {
              adapter: nestjs_1.StorageAdapterEnum.redis,
              options: {
                url: configService.get('REDIS_URL') || '',
              },
            },
            cacheTTLMS: configService.get('IDEMPOTENCY_CACHE_TTL_MS', 600_000),
          }),
        }),
      ],
      providers: [
        {
          provide: core_1.APP_GUARD,
          useClass: throttler_1.ThrottlerGuard,
        },
      ],
    }),
  ],
  AppModule,
);
//# sourceMappingURL=app.module.js.map
