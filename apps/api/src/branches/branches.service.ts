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
          some: { userId }
        },
      },
      include: {
        memberships: {
          where: { userId },
        }
      }
    });

    if (!business) {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'You do not have access to this business.',
      });
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const membership = business.memberships[0];
      if (!membership || !requiredRoles.includes(membership.role)) {
        throw new ForbiddenException({
          code: ERROR_CODES.FORBIDDEN,
          message: 'You do not have the required permissions to perform this action.',
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
        message: `Branch with this name ""${dto.name}"" already exists for this business.`,
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
          message: `Branch with this name "${dto.name}" already exists for this business.`,
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

    return this.prisma.branch.update({
      where: { id: branchId },
      data: { isActive: false }
    });
  }
}
