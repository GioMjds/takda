import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { HttpQuery } from './common/decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @HttpQuery()
  getHello(): { message: string; timestamp: Date } {
    return this.appService.getHello();
  }
}
