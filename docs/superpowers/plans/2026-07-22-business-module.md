# Business Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement CRUD endpoints, owner-scoped listing, slug uniqueness, and Zod output schemas for the existing `Business` model.

**Architecture:** Extend `@takda/shared` with business validation schemas and export new error codes. Set up owner-scoped access validation in `BusinessesService` using `PrismaService`, wrapping updates and creations inside transactions to prevent slug duplication. Bind endpoints to `BusinessesController` protected by NestJS global guards `JwtAuthGuard` + `RolesGuard`.

**Tech Stack:** NestJS 11, Prisma 7, Zod 4, TypeScript, Jest, Supertest.

## Global Constraints

- Wire contract change is additive only — no existing field renames, removals, or type changes.
- TypeScript `strict: true`. No `any`, no `// @ts-ignore`.
- All validation schemas live in `@takda/shared` — no local `z.object({...})` definitions in controllers.

---

### File Structure Map

- Modify: `packages/shared/src/constants/errors.ts`
- Modify: `packages/shared/src/schemas/business.ts`
- Modify: `packages/shared/src/schemas/index.ts`
- Modify: `apps/api/src/businesses/businesses.service.ts`
- Modify: `apps/api/src/businesses/businesses.controller.ts`
- Modify: `apps/api/src/businesses/businesses.module.ts`
- Create: `apps/api/src/businesses/__tests__/businesses.service.spec.ts`
- Create: `apps/api/test/businesses.e2e-spec.ts`

---

### Task 1: Wire Contract Additions in `@takda/shared`

**Files:**

- Modify: `packages/shared/src/constants/errors.ts:1-24`
- Modify: `packages/shared/src/schemas/business.ts:1-26`
- Modify: `packages/shared/src/schemas/index.ts:1-8`

**Interfaces:**

- Consumes: none
- Produces: Zod schemas `createBusinessInputSchema`, `updateBusinessInputSchema`, `listBusinessesQuerySchema` and their typescript types. Error code keys `BUSINESS_SLUG_TAKEN`, `BUSINESS_NOT_OWNED`.

- [ ] **Step 1: Extend `packages/shared/src/constants/errors.ts` with error codes**

Add `BUSINESS_SLUG_TAKEN` and `BUSINESS_NOT_OWNED` to the `ERROR_CODES` constant:

```typescript
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  IDEMPOTENCY_KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
  SLOT_TAKEN: 'SLOT_TAKEN',
  SLOT_FULL: 'SLOT_FULL',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  BUSINESS_NOT_FOUND: 'BUSINESS_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  BOOKING_TERMINAL: 'BOOKING_TERMINAL',
  QUEUE_TOKEN_INVALID: 'QUEUE_TOKEN_INVALID',
  QUEUE_EMPTY: 'QUEUE_EMPTY',
  QUEUE_ALREADY_SERVING: 'QUEUE_ALREADY_SERVING',
  BOOKING_NOT_SERVING: 'BOOKING_NOT_SERVING',
  RECALL_WINDOW_EXPIRED: 'RECALL_WINDOW_EXPIRED',
  SERVICE_FULL: 'SERVICE_FULL',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  BUSINESS_SLUG_TAKEN: 'BUSINESS_SLUG_TAKEN',
  BUSINESS_NOT_OWNED: 'BUSINESS_NOT_OWNED',
} as const;
```

- [ ] **Step 2: Extend `packages/shared/src/schemas/business.ts` with validation schemas**

Create the schema definitions and export the TypeScript types:

```typescript
export const createBusinessInputSchema = z.object({
  slug: businessSlugSchema,
  name: z.string().min(1, 'Name is required'),
  timezone: z.string().default('Asia/Manila'),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});
export type CreateBusinessInput = z.infer<typeof createBusinessInputSchema>;

export const updateBusinessInputSchema = createBusinessInputSchema.partial();
export type UpdateBusinessInput = z.infer<typeof updateBusinessInputSchema>;

export const listBusinessesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
export type ListBusinessesQuery = z.infer<typeof listBusinessesQuerySchema>;
```

- [ ] **Step 3: Verify the exports in `packages/shared/src/schemas/index.ts`**

Make sure `export * from './business';` exists so that the new schemas are properly exported from the index.

```typescript
export * from './business';
export * from './service';
export * from './booking';
export * from './queue';
export * from './slot';
export * from './auth';
```

- [ ] **Step 4: Run typecheck to verify typescript is green**

Run command in root directory:
`pnpm --filter @takda/shared typecheck`
Expected: PASS

- [ ] **Step 5: Commit contract changes**

Run command in root directory:

```bash
git add packages/shared/src/constants/errors.ts packages/shared/src/schemas/business.ts
git commit -m "feat(shared): add business schemas and error codes"
```

---

### Task 2: Implement `BusinessesService` CRUD Operations

**Files:**

- Modify: `apps/api/src/businesses/businesses.service.ts:1-5`
- Create: `apps/api/src/businesses/__tests__/businesses.service.spec.ts`

**Interfaces:**

- Consumes: `CreateBusinessInput`, `UpdateBusinessInput`, `ListBusinessesQuery` from `@takda/shared`
- Produces: `BusinessesService` methods:
  - `create(tenantId: string, userId: string, dto: CreateBusinessInput): Promise<Business>`
  - `findAll(userId: string, query: ListBusinessesQuery): Promise<Business[]>`
  - `findOne(idOrSlug: string, userId: string): Promise<Business>`
  - `update(idOrSlug: string, userId: string, dto: UpdateBusinessInput): Promise<Business>`
  - `softDelete(idOrSlug: string, userId: string): Promise<Business>`

- [ ] **Step 1: Create unit test file `apps/api/src/businesses/__tests__/businesses.service.spec.ts`**

Write Jest unit tests mocking the `PrismaService` behavior:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BusinessesService } from '../businesses.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('BusinessesService', () => {
  let service: BusinessesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      business: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      membership: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BusinessesService>(BusinessesService);
  });

  it('should create a business and default membership inside a transaction', async () => {
    prisma.business.findUnique.mockResolvedValue(null);
    const mockBiz = {
      id: 'biz_1',
      slug: 'my-shop',
      name: 'My Shop',
      tenantId: 't_1',
    };
    prisma.business.create.mockResolvedValue(mockBiz);

    const result = await service.create('t_1', 'u_1', {
      slug: 'my-shop',
      name: 'My Shop',
      timezone: 'Asia/Manila',
    });

    expect(prisma.business.create).toHaveBeenCalled();
    expect(prisma.membership.create).toHaveBeenCalledWith({
      data: { userId: 'u_1', businessId: 'biz_1', role: 'OWNER' },
    });
    expect(result).toEqual(mockBiz);
  });

  it('should throw ConflictException if business slug is already taken under the same tenant', async () => {
    prisma.business.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create('t_1', 'u_1', {
        slug: 'my-shop',
        name: 'My Shop',
        timezone: 'Asia/Manila',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should find active businesses user has membership on', async () => {
    prisma.business.findMany.mockResolvedValue([{ id: 'biz_1' }]);

    const result = await service.findAll('u_1', { limit: 10, offset: 0 });
    expect(result).toHaveLength(1);
    expect(prisma.business.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        memberships: { some: { userId: 'u_1' } },
      },
      take: 10,
      skip: 0,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should find one business by ID or slug if user has membership', async () => {
    const mockBiz = { id: 'biz_1', slug: 'my-shop' };
    prisma.business.findFirst.mockResolvedValue(mockBiz);

    const result = await service.findOne('my-shop', 'u_1');
    expect(result).toEqual(mockBiz);
    expect(prisma.business.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ id: 'my-shop' }, { slug: 'my-shop' }],
        isActive: true,
        memberships: { some: { userId: 'u_1' } },
      },
    });
  });

  it('should throw NotFoundException if finding business fails or user has no membership', async () => {
    prisma.business.findFirst.mockResolvedValue(null);

    await expect(service.findOne('my-shop', 'u_1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update business if user is OWNER or MANAGER', async () => {
    const mockBiz = {
      id: 'biz_1',
      slug: 'my-shop',
      memberships: [{ role: 'OWNER' }],
    };
    prisma.business.findFirst.mockResolvedValue(mockBiz);
    prisma.business.update.mockResolvedValue({ ...mockBiz, name: 'New Name' });

    const result = await service.update('biz_1', 'u_1', { name: 'New Name' });
    expect(result.name).toBe('New Name');
  });

  it('should throw ForbiddenException if updating business and user is only STAFF', async () => {
    const mockBiz = {
      id: 'biz_1',
      slug: 'my-shop',
      memberships: [{ role: 'STAFF' }],
    };
    prisma.business.findFirst.mockResolvedValue(mockBiz);

    await expect(
      service.update('biz_1', 'u_1', { name: 'New Name' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run command in root directory:
`pnpm --filter @takda/api test src/businesses/__tests__/businesses.service.spec.ts`
Expected: FAIL (compilation errors due to missing methods in `BusinessesService`)

- [ ] **Step 3: Implement `apps/api/src/businesses/businesses.service.ts`**

Update the service file to implement the database logic:

```typescript
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBusinessInput,
  UpdateBusinessInput,
  ListBusinessesQuery,
  ERROR_CODES,
} from '@takda/shared';
import { Business } from '@prisma/client';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateBusinessInput,
  ): Promise<Business> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.business.findUnique({
        where: {
          tenantId_slug: {
            tenantId,
            slug: dto.slug,
          },
        },
      });

      if (existing) {
        throw new ConflictException({
          code: ERROR_CODES.BUSINESS_SLUG_TAKEN,
          message: `Slug '${dto.slug}' is already taken`,
        });
      }

      const business = await tx.business.create({
        data: {
          tenantId,
          slug: dto.slug,
          name: dto.name,
          timezone: dto.timezone || 'Asia/Manila',
          address: dto.address || null,
          phone: dto.phone || null,
          isActive: true,
        },
      });

      await tx.membership.create({
        data: {
          userId,
          businessId: business.id,
          role: 'OWNER',
        },
      });

      return business;
    });
  }

  async findAll(
    userId: string,
    query: ListBusinessesQuery,
  ): Promise<Business[]> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    return this.prisma.business.findMany({
      where: {
        isActive: true,
        memberships: {
          some: {
            userId,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(idOrSlug: string, userId: string): Promise<Business> {
    const business = await this.prisma.business.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
        memberships: {
          some: {
            userId,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException({
        code: ERROR_CODES.BUSINESS_NOT_FOUND,
        message: `Business '${idOrSlug}' not found`,
      });
    }

    return business;
  }

  async update(
    idOrSlug: string,
    userId: string,
    dto: UpdateBusinessInput,
  ): Promise<Business> {
    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
          isActive: true,
        },
        include: {
          memberships: {
            where: { userId },
          },
        },
      });

      if (!business) {
        throw new NotFoundException({
          code: ERROR_CODES.BUSINESS_NOT_FOUND,
          message: `Business '${idOrSlug}' not found`,
        });
      }

      const membership = business.memberships[0];
      if (
        !membership ||
        (membership.role !== 'OWNER' && membership.role !== 'MANAGER')
      ) {
        throw new ForbiddenException({
          code: ERROR_CODES.FORBIDDEN,
          message: 'You do not have access to manage this business',
        });
      }

      if (dto.slug && dto.slug !== business.slug) {
        const existing = await tx.business.findUnique({
          where: {
            tenantId_slug: {
              tenantId: business.tenantId,
              slug: dto.slug,
            },
          },
        });

        if (existing) {
          throw new ConflictException({
            code: ERROR_CODES.BUSINESS_SLUG_TAKEN,
            message: `Slug '${dto.slug}' is already taken`,
          });
        }
      }

      return tx.business.update({
        where: { id: business.id },
        data: {
          name: dto.name,
          slug: dto.slug,
          timezone: dto.timezone,
          address: dto.address,
          phone: dto.phone,
        },
      });
    });
  }

  async softDelete(idOrSlug: string, userId: string): Promise<Business> {
    const business = await this.prisma.business.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
      },
      include: {
        memberships: {
          where: { userId },
        },
      },
    });

    if (!business) {
      throw new NotFoundException({
        code: ERROR_CODES.BUSINESS_NOT_FOUND,
        message: `Business '${idOrSlug}' not found`,
      });
    }

    const membership = business.memberships[0];
    if (!membership || membership.role !== 'OWNER') {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'Only the business owner can delete this business',
      });
    }

    return this.prisma.business.update({
      where: { id: business.id },
      data: { isActive: false },
    });
  }
}
```

- [ ] **Step 4: Run test to verify they pass**

Run command in root directory:
`pnpm --filter @takda/api test src/businesses/__tests__/businesses.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

Run command in root directory:

```bash
git add apps/api/src/businesses/businesses.service.ts apps/api/src/businesses/__tests__/businesses.service.spec.ts
git commit -m "feat(api): implement businesses service and unit tests"
```

---

### Task 3: Expose Business REST Endpoints

**Files:**

- Modify: `apps/api/src/businesses/businesses.controller.ts:1-8`
- Modify: `apps/api/src/businesses/businesses.module.ts:1-10`
- Create: `apps/api/test/businesses.e2e-spec.ts`

**Interfaces:**

- Consumes: `BusinessesService`
- Produces: `/v1/businesses` REST API endpoints:
  - `POST /v1/businesses` (Create business)
  - `GET /v1/businesses` (List user's businesses)
  - `GET /v1/businesses/:idOrSlug` (Get details)
  - `PATCH /v1/businesses/:idOrSlug` (Update fields)
  - `DELETE /v1/businesses/:idOrSlug` (Soft delete)

- [ ] **Step 1: Create E2E test file `apps/api/test/businesses.e2e-spec.ts`**

Write Supertest-based integration tests verifying the REST endpoints under JWT auth:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/prisma/prisma.service';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run command in root directory:
`pnpm --filter @takda/api test:e2e test/businesses.e2e-spec.ts`
Expected: FAIL (Endpoints not implemented or return 404/500)

- [ ] **Step 3: Modify `apps/api/src/businesses/businesses.controller.ts`**

Implement routing and validate payloads with `ZodValidationPipe`:

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  createBusinessInputSchema,
  updateBusinessInputSchema,
  listBusinessesQuerySchema,
  CreateBusinessInput,
  UpdateBusinessInput,
  ListBusinessesQuery,
} from '@takda/shared';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BusinessesService } from './businesses.service';

@Controller({ path: 'businesses', version: '1' })
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.STAFF)
export class BusinessesController {
  constructor(private readonly service: BusinessesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UsePipes(new ZodValidationPipe(createBusinessInputSchema))
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBusinessInput,
  ) {
    return this.service.create(user.tenantId, user.userId, dto);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(listBusinessesQuerySchema))
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: ListBusinessesQuery,
  ) {
    return this.service.findAll(userId, query);
  }

  @Get(':idOrSlug')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('idOrSlug') idOrSlug: string,
  ) {
    return this.service.findOne(idOrSlug, userId);
  }

  @Patch(':idOrSlug')
  @UsePipes(new ZodValidationPipe(updateBusinessInputSchema))
  async update(
    @CurrentUser('userId') userId: string,
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: UpdateBusinessInput,
  ) {
    return this.service.update(idOrSlug, userId, dto);
  }

  @Delete(':idOrSlug')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('idOrSlug') idOrSlug: string,
  ) {
    return this.service.softDelete(idOrSlug, userId);
  }
}
```

- [ ] **Step 4: Modify `apps/api/src/businesses/businesses.module.ts` to export `BusinessesService`**

Ensure `BusinessesService` is exported for downstream modules (Branches, Employee assignments, settings):

```typescript
import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';

@Module({
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
```

- [ ] **Step 5: Run E2E tests to verify they pass**

Run command in root directory:
`pnpm --filter @takda/api test:e2e test/businesses.e2e-spec.ts`
Expected: PASS

- [ ] **Step 6: Commit controller and E2E changes**

Run command in root directory:

```bash
git add apps/api/src/businesses/businesses.controller.ts apps/api/src/businesses/businesses.module.ts apps/api/test/businesses.e2e-spec.ts
git commit -m "feat(api): expose business REST endpoints and add E2E tests"
```

---

### Task 4: Quality Gate and Build Verification

**Files:** none

**Interfaces:** none

- [ ] **Step 1: Run complete typecheck**

Run command in root directory:

```bash
pnpm --filter @takda/shared typecheck
pnpm --filter @takda/api typecheck
```

Expected: PASS

- [ ] **Step 2: Run complete lint check**

Run command in root directory:
`pnpm lint`
Expected: PASS

- [ ] **Step 3: Run full tests**

Run command in root directory:
`pnpm test`
Expected: PASS

- [ ] **Step 4: Run root build verification**

Run command in root directory:
`pnpm build`
Expected: PASS
