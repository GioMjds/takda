import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { EmployeesService } from '../employees/employees.service';
import {
  CreateInviteInput,
  AcceptInviteInput,
  ERROR_CODES,
  MembershipRole,
} from '@takda/shared';
import * as crypto from 'crypto';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly employeesService: EmployeesService,
    private readonly configService: ConfigService,
  ) {}

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
        message: `Business with ID ${businessId} not found`,
      });
    }

    const calledMembership = await tx.membership.findFirst({
      where: {
        businessId,
        userId: callerUserId,
      },
    });

    if (!calledMembership || !allowedRoles.includes(calledMembership.role)) {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'You do not have sufficient permissions for this operation.',
      });
    }

    return { business, calledMembership };
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  async create(
    businessId: string,
    callerUserId: string,
    dto: CreateInviteInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { business } = await this.assertCallerAccess(
        tx,
        businessId,
        callerUserId,
        ['OWNER', 'MANAGER'],
      );

      const existingUser = await tx.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: business.tenantId,
            email: dto.email,
          },
        },
      });

      if (existingUser) {
        const existingMembership = await tx.membership.findFirst({
          where: {
            businessId,
            userId: existingUser.id,
          },
        });

        if (existingMembership) {
          throw new ConflictException({
            code: ERROR_CODES.EMPLOYEE_ALREADY_EXISTS,
            message: 'User is already an employee of this business.',
          });
        }
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invite = await tx.staffInvite.create({
        data: {
          businessId,
          email: dto.email,
          role: dto.role ?? 'STAFF',
          tokenHash,
          invitedById: callerUserId,
          expiresAt,
        },
      });

      const webBaseUrl =
        this.configService.get<string>('APP_WEB_URL') ||
        'http://localhost:3000';
      const acceptUrl = `${webBaseUrl}/invites/accept?token=${rawToken}`;

      await this.emailService.sendStaffInvite(
        dto.email,
        business.name,
        acceptUrl,
      );

      return { invite, token: rawToken };
    });
  }

  async listForBusiness(businessId: string, callerUserId: string) {
    await this.assertCallerAccess(this.prisma, businessId, callerUserId, [
      'OWNER',
      'MANAGER',
      'STAFF',
    ]);

    return this.prisma.staffInvite.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(businessId: string, callerUserId: string, inviteId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.assertCallerAccess(tx, businessId, callerUserId, [
        'OWNER',
        'MANAGER',
      ]);

      const invite = await tx.staffInvite.findFirst({
        where: { id: inviteId, businessId },
      });

      if (!invite) {
        throw new NotFoundException({
          code: ERROR_CODES.NOT_FOUND,
          message: `Invite with ID ${inviteId} not found.`,
        });
      }

      if (invite.acceptedAt) {
        throw new ConflictException({
          code: ERROR_CODES.INVITE_ALREADY_ACCEPTED,
          message: 'Cannot revoke an invite that has already been accepted.',
        });
      }

      return tx.staffInvite.update({
        where: { id: inviteId },
        data: { revokedAt: new Date() },
      });
    });
  }

  async accept(token: string, dto: AcceptInviteInput) {
    const tokenHash = this.hashToken(token);

    const invite = await this.prisma.staffInvite.findFirst({
      where: { tokenHash },
      include: { business: true },
    });

    if (!invite) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Invalid invitation token.',
      });
    }

    if (invite.revokedAt) {
      throw new ConflictException({
        code: ERROR_CODES.INVITE_REVOKED,
        message: 'This invitation has been revoked.',
      });
    }

    if (invite.acceptedAt) {
      throw new ConflictException({
        code: ERROR_CODES.INVITE_ALREADY_ACCEPTED,
        message: 'This invitation has already been accepted.',
      });
    }

    if (invite.expiresAt < new Date()) {
      throw new ConflictException({
        code: ERROR_CODES.INVITE_EXPIRED,
        message: 'This invitation has expired.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const membership = await this.employeesService.createMembershipFromInvite(
        tx,
        invite.businessId,
        invite.business.tenantId,
        invite.email,
        invite.role,
        { name: dto.name, password: dto.password },
      );

      await tx.staffInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return { message: 'Invite accepted successfully', membership };
    });
  }
}
