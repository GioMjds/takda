import { ConflictException, NotFoundException } from '@nestjs/common';
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

    it('creates a new user inline when userId is not provided', async () => {
      prisma.business.findFirst.mockResolvedValue(mockBusiness as any);
      prisma.membership.findFirst
        .mockResolvedValueOnce(mockMembershipOwner as any)
        .mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'usr_new_inline',
        tenantId: 'tenant_123',
        email: 'inline@example.com',
        name: 'Inline User',
      } as any);
      prisma.membership.create.mockResolvedValue({
        id: 'mem_inline',
        userId: 'usr_new_inline',
        businessId: 'biz_123',
        role: 'STAFF',
      } as any);

      const result = await service.add('biz_123', 'usr_owner', {
        email: 'inline@example.com',
        name: 'Inline User',
        role: 'STAFF',
      });

      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.id).toBe('mem_inline');
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

    it('rejects inline user creation if email or name is missing', async () => {
      prisma.business.findFirst.mockResolvedValue(mockBusiness as any);
      prisma.membership.findFirst.mockResolvedValueOnce(
        mockMembershipOwner as any,
      );

      await expect(
        service.add('biz_123', 'usr_owner', {
          email: 'inline@example.com',
          role: 'STAFF',
          // name missing
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listForBusiness', () => {
    it('returns a list of employees for the business', async () => {
      prisma.business.findFirst.mockResolvedValue(mockBusiness as any);
      prisma.membership.findFirst.mockResolvedValueOnce(
        mockMembershipOwner as any,
      );
      prisma.membership.findMany.mockResolvedValue([
        mockMembershipStaff,
      ] as any);

      const result = await service.listForBusiness('biz_123', 'usr_owner', {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mem_staff');
    });
  });

  describe('findOne', () => {
    it('returns employee membership if found', async () => {
      prisma.business.findFirst.mockResolvedValue(mockBusiness as any);
      prisma.membership.findFirst
        .mockResolvedValueOnce(mockMembershipOwner as any) // caller check
        .mockResolvedValueOnce(mockMembershipStaff as any); // target lookup

      const result = await service.findOne('biz_123', 'usr_owner', 'mem_staff');

      expect(result.id).toBe('mem_staff');
    });

    it('throws NotFoundException if employee is not found', async () => {
      prisma.business.findFirst.mockResolvedValue(mockBusiness as any);
      prisma.membership.findFirst
        .mockResolvedValueOnce(mockMembershipOwner as any)
        .mockResolvedValueOnce(null);

      await expect(
        service.findOne('biz_123', 'usr_owner', 'mem_nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('updates role successfully when not last owner', async () => {
      prisma.business.findFirst.mockResolvedValue(mockBusiness as any);
      prisma.membership.findFirst
        .mockResolvedValueOnce(mockMembershipOwner as any) // caller check
        .mockResolvedValueOnce(mockMembershipStaff as any); // target lookup
      prisma.membership.update.mockResolvedValue({
        ...mockMembershipStaff,
        role: 'MANAGER',
      } as any);

      const result = await service.updateRole(
        'biz_123',
        'usr_owner',
        'mem_staff',
        {
          role: 'MANAGER',
        },
      );

      expect(result.role).toBe('MANAGER');
    });

    it('rejects demoting the last OWNER', async () => {
      prisma.business.findFirst.mockResolvedValue(mockBusiness as any);
      prisma.membership.findFirst
        .mockResolvedValueOnce(mockMembershipOwner as any)
        .mockResolvedValueOnce(mockMembershipOwner as any);
      prisma.membership.count.mockResolvedValue(1);

      await expect(
        service.updateRole('biz_123', 'usr_owner', 'mem_owner', {
          role: 'STAFF',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ERROR_CODES.EMPLOYEE_LAST_OWNER,
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('removes staff member successfully', async () => {
      prisma.business.findFirst.mockResolvedValue(mockBusiness as any);
      prisma.membership.findFirst
        .mockResolvedValueOnce(mockMembershipOwner as any)
        .mockResolvedValueOnce(mockMembershipStaff as any);
      prisma.membership.delete.mockResolvedValue(mockMembershipStaff as any);

      const result = await service.remove('biz_123', 'usr_owner', 'mem_staff');

      expect(result.id).toBe('mem_staff');
      expect(prisma.membership.delete).toHaveBeenCalledWith({
        where: { id: 'mem_staff' },
      });
    });

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

  describe('createMembershipFromInvite', () => {
    it('creates user and membership for new email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'usr_invite_new',
        tenantId: 'tenant_123',
        email: 'invite@example.com',
        name: 'Invited User',
      } as any);
      prisma.membership.findFirst.mockResolvedValue(null);
      prisma.membership.create.mockResolvedValue({
        id: 'mem_invite_new',
        userId: 'usr_invite_new',
        businessId: 'biz_123',
        role: 'STAFF',
      } as any);

      const result = await service.createMembershipFromInvite(
        prisma,
        'biz_123',
        'tenant_123',
        'invite@example.com',
        'STAFF',
        { name: 'Invited User', password: 'Password123!' },
      );

      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.membership.create).toHaveBeenCalled();
      expect(result.id).toBe('mem_invite_new');
    });

    it('links existing user and creates membership for existing email', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'usr_existing',
        tenantId: 'tenant_123',
        email: 'existing@example.com',
      } as any);
      prisma.membership.findFirst.mockResolvedValue(null);
      prisma.membership.create.mockResolvedValue({
        id: 'mem_invite_existing',
        userId: 'usr_existing',
        businessId: 'biz_123',
        role: 'STAFF',
      } as any);

      const result = await service.createMembershipFromInvite(
        prisma,
        'biz_123',
        'tenant_123',
        'existing@example.com',
        'STAFF',
        {},
      );

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result.id).toBe('mem_invite_existing');
    });

    it('throws validation error if new user lacks name or password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createMembershipFromInvite(
          prisma,
          'biz_123',
          'tenant_123',
          'new@example.com',
          'STAFF',
          { name: 'Only Name' },
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ERROR_CODES.VALIDATION_ERROR,
          }),
        }),
      );
    });

    it('throws conflict error if user is already a member', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'usr_existing',
        tenantId: 'tenant_123',
        email: 'existing@example.com',
      } as any);
      prisma.membership.findFirst.mockResolvedValue(mockMembershipStaff as any);

      await expect(
        service.createMembershipFromInvite(
          prisma,
          'biz_123',
          'tenant_123',
          'existing@example.com',
          'STAFF',
          {},
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ERROR_CODES.EMPLOYEE_ALREADY_EXISTS,
          }),
        }),
      );
    });
  });
});
