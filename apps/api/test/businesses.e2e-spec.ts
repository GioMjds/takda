import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/prisma/prisma.service';

import { ENV } from '../src/config/env';

describe('BusinessesController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup seed data for testing
    const tenant = await prisma.tenant.create({
      data: { name: 'E2E Test Tenant', slug: `e2e-test-${Date.now()}` },
    });
    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `owner-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        name: 'Shop Owner',
        role: 'OWNER',
      },
    });
    userId = user.id;

    authToken = jwtService.sign({
      sub: userId,
      tenantId,
      email: user.email,
      role: user.role,
    }, {
      secret: ENV.JWT_SECRET,
    });
  });

  afterAll(async () => {
    // Cleanup seed data
    await prisma.membership.deleteMany({ where: { userId } });
    await prisma.business.deleteMany({ where: { tenantId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await app.close();
  });

  it('POST /v1/businesses -> should create business & membership', async () => {
    const slug = `biz-${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/v1/businesses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        slug,
        name: 'E2E Barber',
        timezone: 'Asia/Manila',
      })
      .expect(201);

    expect(res.body.slug).toBe(slug);
    expect(res.body.name).toBe('E2E Barber');
  });

  it('GET /v1/businesses -> should retrieve memberships', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/businesses')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
