import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Hello Takda! Welcome to the NestJS API!',
      timestamp: new Date(),
    };
  }
}
