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
