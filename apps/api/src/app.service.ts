import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello() {
    this.logger.log('getHello() called');
    const data =  {
      message: 'Hello Takda! Welcome to the NestJS API!',
      timestamp: Date(),
    };
    this.logger.log(`message: ${data.message}, timestamp: ${data.timestamp}`);
    return data;
  }
}
