import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueGateway } from './queue.gateway';
import { QueueTokenService } from './queue-token.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway, QueueTokenService],
  exports: [QueueService, QueueTokenService],
})
export class QueueModule {}
