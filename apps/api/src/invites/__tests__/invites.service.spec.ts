import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitesService } from '../invites.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { EmployeesService } from '../../employees/employees.service';

describe('InvitesService', () => {
  let service: InvitesService;
  let prismaMock: any;
  let emailMock: any;
  let employeesMock: any;

  beforeEach(async () => {
    prismaMock = {
      business: { findFirst: jest.fn() },
      membership: { findFirst: jest.fn() },
      user: { findUnique: jest.fn() },
      staffInvite: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };

    emailMock = {
      sendStaffInvite: jest.fn().mockResolvedValue(undefined),
    };

    employeesMock = {
      createMembershipFromInvite: jest.fn().mockResolvedValue({ id: 'mem-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EmailService, useValue: emailMock },
        { provide: EmployeesService, useValue: employeesMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'APP_WEB_URL') return 'https://takda.app';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<InvitesService>(InvitesService);
  });

  describe('create', () => {
    it('creates an invite and sends an email', async () => {
      prismaMock.business.findFirst.mockResolvedValue({
        id: 'biz-1',
        tenantId: 'tenant-1',
        name: 'Pasig Barbershop',
      });
      prismaMock.membership.findFirst.mockResolvedValue({ role: 'OWNER' });
      prismaMock.user.findUnique.mockResolvedValue(null);

      prismaMock.staffInvite.create.mockResolvedValue({
        id: 'invite-1',
        businessId: 'biz-1',
        email: 'staff@example.com',
        role: 'STAFF',
      });

      const result = await service.create('biz-1', 'caller-1', {
        email: 'staff@example.com',
        role: 'STAFF',
      });

      expect(result.invite).toBeDefined();
      expect(result.token).toBeDefined();
      expect(emailMock.sendStaffInvite).toHaveBeenCalledWith(
        'staff@example.com',
        'Pasig Barbershop',
        expect.stringContaining('https://takda.app'),
      );
    });

    it('throws ConflictException if user is already an employee of the business', async () => {
      prismaMock.business.findFirst.mockResolvedValue({
        id: 'biz-1',
        tenantId: 'tenant-1',
        name: 'Pasig Barbershop',
      });
      prismaMock.membership.findFirst
        .mockResolvedValueOnce({ role: 'OWNER' }) // caller check
        .mockResolvedValueOnce({ id: 'mem-existing' }); // existing membership check

      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });

      await expect(
        service.create('biz-1', 'caller-1', {
          email: 'existing@example.com',
          role: 'STAFF',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('accept', () => {
    it('accepts an invite successfully', async () => {
      prismaMock.staffInvite.findFirst.mockResolvedValue({
        id: 'invite-1',
        businessId: 'biz-1',
        email: 'staff@example.com',
        role: 'STAFF',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        acceptedAt: null,
        business: { tenantId: 'tenant-1' },
      });
      prismaMock.staffInvite.update.mockResolvedValue({});

      const result = await service.accept('valid-token', {
        token: 'valid-token',
        name: 'John Staff',
        password: 'password123',
      });

      expect(result.message).toBe('Invite accepted successfully');
      expect(employeesMock.createMembershipFromInvite).toHaveBeenCalledWith(
        prismaMock,
        'biz-1',
        'tenant-1',
        'staff@example.com',
        'STAFF',
        { name: 'John Staff', password: 'password123' },
      );
    });

    it('rejects invite accept if expired', async () => {
      prismaMock.staffInvite.findFirst.mockResolvedValue({
        id: 'invite-1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() - 1000), // expired
        revokedAt: null,
        acceptedAt: null,
        business: { tenantId: 'tenant-1' },
      });

      await expect(
        service.accept('some-token', { token: 'some-token' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});

