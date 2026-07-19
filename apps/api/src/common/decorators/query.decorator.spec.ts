/// <reference types="jest" />
import { Controller, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import supertest from 'supertest';
import { HttpQuery } from './query.decorator';

@Controller('test-decorator')
class TestController {
  @HttpQuery('custom-query')
  handleQuery() {
    return { success: true, message: 'QUERY decorator works!' };
  }
}

@Module({
  controllers: [TestController],
})
class TestModule {}

describe('Query Decorator', () => {
  let app: any;

  beforeAll(async () => {
    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should successfully handle requests with the QUERY method', async () => {
    const server = app.getHttpServer();
    const res = await (supertest(server) as any)
      .query('/test-decorator/custom-query')
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'QUERY decorator works!',
    });
  });
});
