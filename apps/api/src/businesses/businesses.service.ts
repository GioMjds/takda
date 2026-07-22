import {
  Injectable,
  ConflictException,
  ForbiddenException,
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
          message: `Slug ${dto.slug} is already taken`,
        });
      }

      const business = await tx.business.create({
        data: {
          tenantId,
          slug: dto.slug,
          name: dto.name,
          timezone: dto.timezone,
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
          some: { userId },
        },
      },
    });

    if (!business) {
      throw new NotFoundException({
        code: ERROR_CODES.BUSINESS_NOT_FOUND,
        message: `Business ${idOrSlug} not found.`,
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
          message: `Business ${idOrSlug} not found.`,
        });
      }

      const membership = business.memberships[0];

      if (
        !membership ||
        (membership.role !== 'OWNER' && membership.role !== 'MANAGER')
      ) {
        throw new ForbiddenException({
          code: ERROR_CODES.FORBIDDEN,
          message: 'You do not have access to manage this business.',
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
            message: `Slug ${dto.slug} is already taken`,
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
        message: `Business ${idOrSlug} not found.`,
      });
    }

    const membership = business.memberships[0];
    if (!membership || membership.role !== 'OWNER') {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'Only the business owner can delete this business.',
      });
    }

    return this.prisma.business.update({
      where: { id: business.id },
      data: { isActive: false },
    });
  }
}
