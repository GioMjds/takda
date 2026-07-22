import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ERROR_CODES } from '@takda/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeesService } from '../employees.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: any;

  const mockBusiness = {
    id: 'biz_123',
    tenantId: 'tenant_123',
    slug: 'pasig-barbers',
    name: 'Pasig Barbershop',
    timezone: 'Asia/Manila',
    address: null,
    phone: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembershipOwner = {
    id: 'mem_owner',
    userId: 'usr_owner',
    businessId: 'biz_123',
    role: 'OWNER' as const,
    createdAt: new Date(),
  };

  const mockMembershipStaff = {
    id: 'mem_staff',
    userId: 'usr_staff',
    businessId: 'biz_123',
    role: 'STAFF' as const,
    createdAt: new Date(),
    user: {
      id: 'usr_staff',
      name: 'Staff Member',
      email: 'staff@example.com',
      phone: null,
    },
  };

  beforeEach(async () => {
    prisma = {
      business: {
        findFirst: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      membership: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  describe('add', () => {
    it('adds an existing user as an employee', async () => {
      prisma.business.findFirst.mockResolvedValue(mockBusiness as any);
      prisma.membership.findFirst
        .mockResolvedValueOnce(mockMembershipOwner as any) // caller membership check
        .mockResolvedValueOnce(null); // existing membership check for target user
      prisma.user.findUnique.mockResolvedValue({
        id: 'usr_target',
        tenantId: 'tenant_123',
        email: 'target@example.com',
        name: 'Target User',
        phone: null,
      } as any);
      prisma.membership.create.mockResolvedValue({
        id: 'mem_new',
        userId: 'usr_target',
        businessId: 'biz_123',
        role: 'STAFF',
        createdAt: new Date(),
        user: {
          id: 'usr_target',
          name: 'Target User',
          email: 'target@example.com',
          phone: null,
        },
      } as any);

      const result = await service.add('biz_123', 'usr_owner', {
        userId: 'usr_target',
        role: 'STAFF',
      });

      expect(result.id).toBe('mem_new');
    });

    it('rejects if target user is already a member of the business', async () => {
      prisma.business.findFirst.mockResolvedValue(mockBusiness as any);
      prisma.membership.findFirst
        .mockResolvedValueOnce(mockMembershipOwner as any) // caller check
        .mockResolvedValueOnce(mockMembershipStaff as any); // target check

      await expect(
        service.add('biz_123', 'usr_owner', {
          userId: 'usr_staff',
          role: 'STAFF',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('rejects removal of the last OWNER', async () => {
      prisma.business.findFirst.mockResolvedValue(mockBusiness as any);
      prisma.membership.findFirst
        .mockResolvedValueOnce(mockMembershipOwner as any) // caller check
        .mockResolvedValueOnce(mockMembershipOwner as any); // target employee to delete
      prisma.membership.count.mockResolvedValue(1); // count of OWNER memberships is 1

      await expect(
        service.remove('biz_123', 'usr_owner', 'mem_owner'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ERROR_CODES.EMPLOYEE_LAST_OWNER,
          }),
        }),
      );
    });
  });
});
