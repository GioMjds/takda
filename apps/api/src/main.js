'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
require('reflect-metadata');
const common_1 = require('@nestjs/common');
const core_1 = require('@nestjs/core');
const app_module_1 = require('./app.module');
const env_1 = require('./config/env');
const os_1 = require('os');
const cookie_parser_1 = __importDefault(require('cookie-parser'));
const nets = (0, os_1.networkInterfaces)();
let hostIp = '0.0.0.0';
for (const name of Object.keys(nets)) {
  for (const net of nets[name] ?? []) {
    if (net.family === 'IPv4' && !net.internal) {
      hostIp = net.address;
      break;
    }
  }
  if (hostIp !== '0.0.0.0') break;
}
async function bootstrap() {
  const app = await core_1.NestFactory.create(app_module_1.AppModule, {
    logger:
      env_1.ENV.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  app.use((0, cookie_parser_1.default)());
  app.useGlobalPipes(
    new common_1.ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: ['http://localhost:3000', `http://${hostIp}:3000`],
    methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS', 'QUERY'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Bearer',
      'Origin',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials',
    ],
  });
  await app.listen(env_1.ENV.PORT);
  new common_1.Logger('Bootstrap').log(`API listening on :${env_1.ENV.PORT}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map
