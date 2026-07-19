import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { HttpQuery } from './common/decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHelloGet() {
    return this.appService.getHello();
  }

  @HttpQuery()
  getHello() {
    return this.appService.getHello();
  }
}
