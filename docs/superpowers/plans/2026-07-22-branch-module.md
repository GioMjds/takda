# Branch Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement physical business locations (Branch module) supporting 1..N branches per business with CRUD API endpoints, access guards, Zod contract validation, and Prisma schema updates.

**Architecture:** Extend Prisma schema with a `Branch` entity related to `Business`, `Booking`, and `Service`. Add shared Zod schemas and error codes in `@takda/shared`. Implement NestJS feature module `BranchesModule` with `BranchesService` and `BranchesController` under `/v1/businesses/:businessId/branches`.

**Tech Stack:** NestJS 11, Prisma 7, Postgres, TypeScript 5 (strict), Zod 4 (`@takda/shared`), Jest.

## Global Constraints

- **Strict TypeScript:** `strict: true` enabled; no `any` or `// @ts-ignore`.
- **Imports:** Access shared schemas/types via `@takda/shared`, never relative paths.
- **Code Style:** Prettier rules (2 spaces, single quotes, trailing commas, LF).
- **Error Format:** Return typed exceptions with error codes from `ERROR_CODES`.
- **Definition of Done:** `pnpm build`, `pnpm typecheck`, `pnpm lint`, and workspace tests pass.

---

### Task 1: Prisma Schema & Migration for Branch Model

**Files:**

- Modify: `apps/api/prisma/schema.prisma:89-113` (Add `branches Branch[]` to `Business`)
- Modify: `apps/api/prisma/schema.prisma:148-176` (Add `branchId` and `branch` relation to `Service`)
- Modify: `apps/api/prisma/schema.prisma:186-244` (Add `branchId` and `branch` relation to `Booking`)
- Modify: `apps/api/prisma/schema.prisma:471` (Add `Branch` model definition)

**Interfaces:**

- Consumes: Existing `Business`, `Service`, `Booking` models in `apps/api/prisma/schema.prisma`.
- Produces: `Branch` model and updated relations for `Business`, `Service`, and `Booking`.

- [ ] **Step 1: Write failing schema update and verify migration failure pre-update**

Verify current Prisma schema validity before editing:
Run: `pnpm --filter @takda/api exec prisma validate`
Expected: PASS

- [ ] **Step 2: Add Branch model and relation fields to schema.prisma**

Edit `apps/api/prisma/schema.prisma`:

In `model Business` (around line 110):

```prisma
  overrides   DayOverride[]
  branches    Branch[]
```

In `model Service` (around line 167):

```prisma
  branchId        String?
  branch          Branch?  @relation(fields: [branchId], references: [id], onDelete: SetNull)
```

In `model Booking` (around line 228):

```prisma
  branchId        String?
  branch          Branch?  @relation(fields: [branchId], references: [id], onDelete: SetNull)
```

At the end of `apps/api/prisma/schema.prisma` (after line 471):

```prisma
// -----------------------------------------------------------------------------
// Branch
// -----------------------------------------------------------------------------

/// A physical location of a business. Bookings and services can scope to a branch.
model Branch {
  id         String   @id @default(cuid())
  businessId String
  name       String
  address    String?
  phone      String?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  business Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  bookings Booking[]
  services Service[]

  @@unique([businessId, name])
  @@index([businessId])
}
```

- [ ] **Step 3: Validate schema and generate Prisma Client**

Run: `pnpm --filter @takda/api exec prisma validate`
Expected: `The schema at apps/api/prisma/schema.prisma is valid.`

Run: `pnpm --filter @takda/api exec prisma generate`
Expected: `✔ Generated Prisma Client`

- [ ] **Step 4: Create migration**

Run: `pnpm --filter @takda/api exec prisma migrate dev --name add_branch_model`
Expected: Migration created and applied successfully.

- [ ] **Step 5: Commit changes**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(api): add Branch model and relations to Prisma schema (#2)"
```

---

### Task 2: Shared Zod Schemas & Error Codes

**Files:**

- Modify: `packages/shared/src/constants/errors.ts:1-26`
- Create: `packages/shared/src/schemas/branch.ts`
- Modify: `packages/shared/src/schemas/index.ts:1-7`

**Interfaces:**

- Consumes: `z` from `zod`.
- Produces: `branchSchema`, `createBranchInputSchema`, `updateBranchInputSchema`, `listBranchesQuerySchema`, `BRANCH_NOT_FOUND`, `BRANCH_NOT_IN_BUSINESS`, `BRANCH_NAME_TAKEN`.

- [ ] **Step 1: Write failing test in packages/shared for branch schema**

Create `packages/shared/src/__tests__/branch.schema.test.ts`:

```typescript
import {
  createBranchInputSchema,
  updateBranchInputSchema,
} from '../schemas/branch';

describe('Branch Schemas', () => {
  it('validates valid create branch input', () => {
    const input = {
      name: 'Main Market Branch',
      address: '123 Palengke St',
      phone: '+639171234567',
    };
    const result = createBranchInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects empty branch name', () => {
    const input = { name: '' };
    const result = createBranchInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @takda/shared test`
Expected: FAIL with module resolve error (cannot find '../schemas/branch').

- [ ] **Step 3: Implement error codes and Zod schemas**

Modify `packages/shared/src/constants/errors.ts`:

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
  BRANCH_NOT_FOUND: 'BRANCH_NOT_FOUND',
  BRANCH_NOT_IN_BUSINESS: 'BRANCH_NOT_IN_BUSINESS',
  BRANCH_NAME_TAKEN: 'BRANCH_NAME_TAKEN',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
```

Create `packages/shared/src/schemas/branch.ts`:

```typescript
import { z } from 'zod';

export const branchSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string().min(1, 'Branch name is required').max(100),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBranchInputSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(100),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const updateBranchInputSchema = createBranchInputSchema.partial();

export const listBranchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export type Branch = z.infer<typeof branchSchema>;
export type CreateBranchInput = z.infer<typeof createBranchInputSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchInputSchema>;
export type ListBranchesQuery = z.infer<typeof listBranchesQuerySchema>;
```

Modify `packages/shared/src/schemas/index.ts`:

```typescript
export * from './business';
export * from './branch';
export * from './service';
export * from './booking';
export * from './queue';
export * from './slot';
export * from './auth';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @takda/shared test`
Expected: PASS

Run: `pnpm --filter @takda/shared typecheck`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add packages/shared/src/constants/errors.ts packages/shared/src/schemas/branch.ts packages/shared/src/schemas/index.ts packages/shared/src/__tests__/branch.schema.test.ts
git commit -m "feat(shared): add Branch schemas and error codes (#2)"
```

---

### Task 3: Branches Service & Unit Tests

**Files:**

- Create: `apps/api/src/branches/branches.service.ts`
- Create: `apps/api/src/branches/branches.module.ts`
- Create: `apps/api/src/branches/__tests__/branches.service.spec.ts`

**Interfaces:**

- Consumes: `PrismaService`, `CreateBranchInput`, `UpdateBranchInput`, `ListBranchesQuery`, `ERROR_CODES`.
- Produces: `BranchesService` methods (`create`, `listForBusiness`, `findOne`, `update`, `softDelete`).

- [ ] **Step 1: Write failing unit tests for BranchesService**

Create `apps/api/src/branches/__tests__/branches.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BranchesService } from '../branches.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ERROR_CODES } from '@takda/shared';

describe('BranchesService', () => {
  let service: BranchesService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    business: {
      findFirst: jest.fn(),
    },
    branch: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a branch successfully when user is owner/manager', async () => {
      mockPrisma.business.findFirst.mockResolvedValue({
        id: 'biz_1',
        memberships: [{ userId: 'user_1', role: 'OWNER' }],
      } as any);

      mockPrisma.branch.findUnique.mockResolvedValue(null);
      mockPrisma.branch.create.mockResolvedValue({
        id: 'branch_1',
        businessId: 'biz_1',
        name: 'Branch 1',
        address: 'Addr 1',
        phone: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.create('biz_1', 'user_1', {
        name: 'Branch 1',
        address: 'Addr 1',
      });
      expect(res.id).toBe('branch_1');
      expect(mockPrisma.branch.create).toHaveBeenCalledWith({
        data: {
          businessId: 'biz_1',
          name: 'Branch 1',
          address: 'Addr 1',
          phone: null,
          isActive: true,
        },
      });
    });

    it('throws ForbiddenException if user lacks membership', async () => {
      mockPrisma.business.findFirst.mockResolvedValue(null);

      await expect(
        service.create('biz_1', 'user_stranger', { name: 'Branch 1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException if branch name is taken in business', async () => {
      mockPrisma.business.findFirst.mockResolvedValue({
        id: 'biz_1',
        memberships: [{ userId: 'user_1', role: 'OWNER' }],
      } as any);

      mockPrisma.branch.findUnique.mockResolvedValue({
        id: 'existing_branch',
      } as any);

      await expect(
        service.create('biz_1', 'user_1', { name: 'Branch 1' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('returns branch if user has access', async () => {
      mockPrisma.business.findFirst.mockResolvedValue({
        id: 'biz_1',
        memberships: [{ userId: 'user_1', role: 'STAFF' }],
      } as any);

      mockPrisma.branch.findFirst.mockResolvedValue({
        id: 'branch_1',
        businessId: 'biz_1',
        name: 'Branch 1',
        isActive: true,
      } as any);

      const res = await service.findOne('biz_1', 'branch_1', 'user_1');
      expect(res.id).toBe('branch_1');
    });

    it('throws NotFoundException when branch is missing', async () => {
      mockPrisma.business.findFirst.mockResolvedValue({
        id: 'biz_1',
        memberships: [{ userId: 'user_1', role: 'STAFF' }],
      } as any);
      mockPrisma.branch.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('biz_1', 'nonexistent', 'user_1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @takda/api test apps/api/src/branches/__tests__/branches.service.spec.ts`
Expected: FAIL with "Cannot find module '../branches.service'".

- [ ] **Step 3: Implement BranchesService and BranchesModule**

Create `apps/api/src/branches/branches.service.ts`:

```typescript
import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Branch } from '@prisma/client';
import {
  CreateBranchInput,
  UpdateBranchInput,
  ListBranchesQuery,
  ERROR_CODES,
} from '@takda/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyBusinessAccess(
    businessId: string,
    userId: string,
    requiredRoles?: ('OWNER' | 'MANAGER' | 'STAFF')[],
  ) {
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        isActive: true,
        memberships: {
          some: { userId },
        },
      },
      include: {
        memberships: {
          where: { userId },
        },
      },
    });

    if (!business) {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'You do not have access to this business.',
      });
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const membership = business.memberships[0];
      if (!membership || !requiredRoles.includes(membership.role as any)) {
        throw new ForbiddenException({
          code: ERROR_CODES.FORBIDDEN,
          message: 'Insufficient permissions for this operation.',
        });
      }
    }

    return business;
  }

  async create(
    businessId: string,
    userId: string,
    dto: CreateBranchInput,
  ): Promise<Branch> {
    await this.verifyBusinessAccess(businessId, userId, ['OWNER', 'MANAGER']);

    const existing = await this.prisma.branch.findUnique({
      where: {
        businessId_name: {
          businessId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException({
        code: ERROR_CODES.BRANCH_NAME_TAKEN,
        message: `Branch with name "${dto.name}" already exists for this business.`,
      });
    }

    return this.prisma.branch.create({
      data: {
        businessId,
        name: dto.name,
        address: dto.address ?? null,
        phone: dto.phone ?? null,
        isActive: true,
      },
    });
  }

  async listForBusiness(
    businessId: string,
    userId: string,
    query: ListBranchesQuery,
  ): Promise<Branch[]> {
    await this.verifyBusinessAccess(businessId, userId);

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const includeInactive = query.includeInactive ?? false;

    return this.prisma.branch.findMany({
      where: {
        businessId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(
    businessId: string,
    branchId: string,
    userId: string,
  ): Promise<Branch> {
    await this.verifyBusinessAccess(businessId, userId);

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        businessId,
        isActive: true,
      },
    });

    if (!branch) {
      throw new NotFoundException({
        code: ERROR_CODES.BRANCH_NOT_FOUND,
        message: `Branch ${branchId} not found in this business.`,
      });
    }

    return branch;
  }

  async update(
    businessId: string,
    branchId: string,
    userId: string,
    dto: UpdateBranchInput,
  ): Promise<Branch> {
    await this.verifyBusinessAccess(businessId, userId, ['OWNER', 'MANAGER']);

    const branch = await this.findOne(businessId, branchId, userId);

    if (dto.name && dto.name !== branch.name) {
      const existing = await this.prisma.branch.findUnique({
        where: {
          businessId_name: {
            businessId,
            name: dto.name,
          },
        },
      });

      if (existing) {
        throw new ConflictException({
          code: ERROR_CODES.BRANCH_NAME_TAKEN,
          message: `Branch with name "${dto.name}" already exists for this business.`,
        });
      }
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
    });
  }

  async softDelete(
    businessId: string,
    branchId: string,
    userId: string,
  ): Promise<Branch> {
    await this.verifyBusinessAccess(businessId, userId, ['OWNER', 'MANAGER']);

    await this.findOne(businessId, branchId, userId);

    return this.prisma.branch.update({
      where: { id: branchId },
      data: { isActive: false },
    });
  }
}
```

Create `apps/api/src/branches/branches.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';

@Module({
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
```

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `pnpm --filter @takda/api test apps/api/src/branches/__tests__/branches.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add apps/api/src/branches/branches.service.ts apps/api/src/branches/branches.module.ts apps/api/src/branches/__tests__/branches.service.spec.ts
git commit -m "feat(api): implement BranchesService business logic and unit tests (#2)"
```

---

### Task 4: Branches Controller & App Module Registration

**Files:**

- Create: `apps/api/src/branches/branches.controller.ts`
- Modify: `apps/api/src/branches/branches.module.ts`
- Modify: `apps/api/src/app.module.ts:17-20,63-66`

**Interfaces:**

- Consumes: `BranchesService`, Zod schemas (`createBranchInputSchema`, `updateBranchInputSchema`, `listBranchesQuerySchema`).
- Produces: REST endpoints at `/v1/businesses/:businessId/branches`.

- [ ] **Step 1: Create BranchesController**

Create `apps/api/src/branches/branches.controller.ts`:

```typescript
import {
  Controller,
  Body,
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
  createBranchInputSchema,
  updateBranchInputSchema,
  listBranchesQuerySchema,
  CreateBranchInput,
  UpdateBranchInput,
  ListBranchesQuery,
} from '@takda/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BranchesService } from './branches.service';

@Controller({ path: 'businesses/:businessId/branches', version: '1' })
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.STAFF)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @UsePipes(new ZodValidationPipe(createBranchInputSchema))
  async create(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Body() dto: CreateBranchInput,
  ) {
    return this.branchesService.create(businessId, userId, dto);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(listBranchesQuerySchema))
  async findAll(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Query() query: ListBranchesQuery,
  ) {
    return this.branchesService.listForBusiness(businessId, userId, query);
  }

  @Get(':branchId')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.branchesService.findOne(businessId, branchId, userId);
  }

  @Patch(':branchId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @UsePipes(new ZodValidationPipe(updateBranchInputSchema))
  async update(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchInput,
  ) {
    return this.branchesService.update(businessId, branchId, userId, dto);
  }

  @Delete(':branchId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.branchesService.softDelete(businessId, branchId, userId);
  }
}
```

- [ ] **Step 2: Update BranchesModule to register BranchesController**

Modify `apps/api/src/branches/branches.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';

@Module({
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
```

- [ ] **Step 3: Register BranchesModule in AppModule**

Modify `apps/api/src/app.module.ts`:
Add import:

```typescript
import { BranchesModule } from './branches/branches.module';
```

And add `BranchesModule` to `imports` array (around line 64):

```typescript
    BookingsModule,
    BusinessesModule,
    BranchesModule,
    NotificationsModule,
```

- [ ] **Step 4: Verify complete project typecheck, lint, and build**

Run: `pnpm --filter @takda/api typecheck`
Expected: PASS

Run: `pnpm --filter @takda/api lint`
Expected: PASS

Run: `pnpm build`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add apps/api/src/branches/branches.controller.ts apps/api/src/branches/branches.module.ts apps/api/src/app.module.ts
git commit -m "feat(api): register BranchesController routes and integrate BranchesModule (#2)"
```

---
