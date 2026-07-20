import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QueueService } from './queue.service';
import { QueueTokenService } from './queue-token.service';
import { QueueController } from './queue.controller';
import { QueueGateway } from './queue.gateway';

@Module({
  imports: [JwtModule.register({})],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway, QueueTokenService],
  exports: [QueueService, QueueTokenService],
})
export class QueueModule {}
