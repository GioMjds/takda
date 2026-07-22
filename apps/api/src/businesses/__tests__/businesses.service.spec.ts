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
