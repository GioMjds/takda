import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ListEmployeesQuery,
  ERROR_CODES,
  MembershipRole,
} from '@takda/shared';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCallerAccess(
    tx: PrismaClientLike,
    businessId: string,
    callerUserId: string,
    allowedRoles: MembershipRole[] = ['OWNER', 'MANAGER'],
  ) {
    const business = await tx.business.findFirst({
      where: { id: businessId, isActive: true },
    });

    if (!business) {
      throw new NotFoundException({
        code: ERROR_CODES.BUSINESS_NOT_FOUND,
        message: `Business with ID ${businessId} not found.`,
      });
    }

    const callerMembership = await tx.membership.findFirst({
      where: {
        businessId,
        userId: callerUserId,
      },
    });

    if (!callerMembership || !allowedRoles.includes(callerMembership.role)) {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'You do not have sufficient permissions for this operation.',
      });
    }

    return { business, callerMembership };
  }

  async add(
    businessId: string,
    callerUserId: string,
    dto: CreateEmployeeInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { business } = await this.assertCallerAccess(
        tx,
        businessId,
        callerUserId,
        ['OWNER', 'MANAGER'],
      );

      let targetUserId = dto.userId;

      if (!targetUserId) {
        // Inline creation of user
        if (!dto.email || !dto.name) {
          throw new ConflictException({
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Must provide either existing userId or email and name.',
          });
        }

        const existingUser = await tx.user.findUnique({
          where: {
            tenantId_email: {
              tenantId: business.tenantId,
              email: dto.email,
            },
          },
        });

        if (existingUser) {
          targetUserId = existingUser.id;
        } else {
          // Generate a random initial password hash for inline created users
          const randomPass = crypto.randomBytes(16).toString('hex');
          const passwordHash = await bcrypt.hash(randomPass, 10);

          const newUser = await tx.user.create({
            data: {
              tenantId: business.tenantId,
              email: dto.email,
              name: dto.name,
              passwordHash,
              role: 'STAFF',
            },
          });

          targetUserId = newUser.id;
        }
      }

      // Check if user already has membership in this business
      const existingMembership = await tx.membership.findFirst({
        where: {
          businessId,
          userId: targetUserId,
        },
      });

      if (existingMembership) {
        throw new ConflictException({
          code: ERROR_CODES.EMPLOYEE_ALREADY_EXISTS,
          message: 'User is already an employee of this business.',
        });
      }

      return tx.membership.create({
        data: {
          businessId,
          userId: targetUserId,
          role: dto.role ?? 'STAFF',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  }

  async listForBusiness(
    businessId: string,
    callerUserId: string,
    query: ListEmployeesQuery,
  ) {
    await this.assertCallerAccess(this.prisma, businessId, callerUserId, [
      'OWNER',
      'MANAGER',
      'STAFF',
    ]);

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    return this.prisma.membership.findMany({
      where: {
        businessId,
        ...(query.role ? { role: query.role } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(businessId: string, callerUserId: string, employeeId: string) {
    await this.assertCallerAccess(this.prisma, businessId, callerUserId, [
      'OWNER',
      'MANAGER',
      'STAFF',
    ]);

    const membership = await this.prisma.membership.findFirst({
      where: {
        businessId,
        OR: [{ id: employeeId }, { userId: employeeId }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException({
        code: ERROR_CODES.EMPLOYEE_NOT_FOUND,
        message: `Employee ${employeeId} not found in business ${businessId}.`,
      });
    }

    return membership;
  }

  async updateRole(
    businessId: string,
    callerUserId: string,
    employeeId: string,
    dto: UpdateEmployeeInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.assertCallerAccess(tx, businessId, callerUserId, ['OWNER']);

      const target = await tx.membership.findFirst({
        where: {
          businessId,
          OR: [{ id: employeeId }, { userId: employeeId }],
        },
      });

      if (!target) {
        throw new NotFoundException({
          code: ERROR_CODES.EMPLOYEE_NOT_FOUND,
          message: `Employee ${employeeId} not found in business ${businessId}.`,
        });
      }

      // If demoting an OWNER to MANAGER/STAFF, check if they are the last OWNER
      if (target.role === 'OWNER' && dto.role !== 'OWNER') {
        const ownerCount = await tx.membership.count({
          where: { businessId, role: 'OWNER' },
        });

        if (ownerCount <= 1) {
          throw new ConflictException({
            code: ERROR_CODES.EMPLOYEE_LAST_OWNER,
            message: 'Cannot demote the last owner of a business.',
          });
        }
      }

      return tx.membership.update({
        where: { id: target.id },
        data: { role: dto.role },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  }

  async remove(businessId: string, callerUserId: string, employeeId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.assertCallerAccess(tx, businessId, callerUserId, ['OWNER']);

      const target = await tx.membership.findFirst({
        where: {
          businessId,
          OR: [{ id: employeeId }, { userId: employeeId }],
        },
      });

      if (!target) {
        throw new NotFoundException({
          code: ERROR_CODES.EMPLOYEE_NOT_FOUND,
          message: `Employee ${employeeId} not found in business ${businessId}.`,
        });
      }

      if (target.role === 'OWNER') {
        const ownerCount = await tx.membership.count({
          where: { businessId, role: 'OWNER' },
        });

        if (ownerCount <= 1) {
          throw new ConflictException({
            code: ERROR_CODES.EMPLOYEE_LAST_OWNER,
            message: 'Cannot remove the last owner of a business.',
          });
        }
      }

      return tx.membership.delete({
        where: { id: target.id },
      });
    });
  }
}
