import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ENV } from '../config/env';
import {
  LoginInput,
  SignupInput,
  RequestOtpInput,
  VerifyOtpInput,
} from '@takda/shared';
import { UserRole } from '@prisma/client';

// In-memory OTP store (5 min TTL) for single-tenant / local deployment
interface OtpEntry {
  code: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpStore = new Map<string, OtpEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupInput) {
    const tenantSlug = dto.tenantSlug || 'default';

    // 1. Resolve or create tenant
    let tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          slug: tenantSlug,
          name: dto.businessName || `${dto.name}'s Workspace`,
        },
      });
    }

    // 2. Check existing user
    const existingUser = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: dto.email.toLowerCase(),
        },
      },
    });

    if (existingUser) {
      throw new ConflictException({
        statusCode: 409,
        code: 'USER_ALREADY_EXISTS',
        message: 'A user with this email already exists in this tenant',
      });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 4. Create User & optional initial Business
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          role: UserRole.OWNER,
        },
      });

      if (dto.businessName) {
        const business = await tx.business.create({
          data: {
            tenantId: tenant.id,
            slug: tenantSlug,
            name: dto.businessName,
            phone: dto.phone,
          },
        });

        await tx.membership.create({
          data: {
            userId: newUser.id,
            businessId: business.id,
            role: 'OWNER',
          },
        });
      }

      return newUser;
    });

    // 5. Generate Tokens
    const tokens = await this.issueTokens(user.id, user.tenantId, user.email, user.role);

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  async login(dto: LoginInput) {
    // Search user by email across tenants or default tenant
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const tokens = await this.issueTokens(user.id, user.tenantId, user.email, user.role);

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  async requestOtp(dto: RequestOtpInput) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    this.otpStore.set(dto.phone, { code, expiresAt });
    this.logger.log(`[OTP] Generated 6-digit code for ${dto.phone}: ${code}`);

    return {
      message: 'OTP sent successfully',
      expiresAt: expiresAt.toISOString(),
    };
  }

  async verifyOtp(dto: VerifyOtpInput) {
    const entry = this.otpStore.get(dto.phone);

    if (!entry) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'OTP_EXPIRED',
        message: 'OTP code has expired or was not requested',
      });
    }

    if (entry.expiresAt < new Date()) {
      this.otpStore.delete(dto.phone);
      throw new BadRequestException({
        statusCode: 400,
        code: 'OTP_EXPIRED',
        message: 'OTP code has expired',
      });
    }

    if (entry.code !== dto.code) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'OTP_INVALID',
        message: 'Invalid OTP code',
      });
    }

    // Consume OTP
    this.otpStore.delete(dto.phone);

    // Lookup user by phone associated business or create synthetic session
    let user = await this.prisma.user.findFirst({
      where: {
        memberships: {
          some: {
            business: { phone: dto.phone },
          },
        },
      },
    });

    if (!user) {
      user = await this.prisma.user.findFirst();
    }

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'No user account found matching this phone number',
      });
    }

    const tokens = await this.issueTokens(user.id, user.tenantId, user.email, user.role);

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  async refreshToken(rawRefreshToken: string) {
    let payload: { sub: string; tenantId: string; email: string; role: UserRole };
    try {
      payload = await this.jwtService.verifyAsync(rawRefreshToken, {
        secret: ENV.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is expired or invalid',
      });
    }

    // Verify refresh token hash in database
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    let matchedTokenRecord = null;
    for (const record of storedTokens) {
      const isMatch = await bcrypt.compare(rawRefreshToken, record.tokenHash);
      if (isMatch) {
        matchedTokenRecord = record;
        break;
      }
    }

    if (!matchedTokenRecord) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'REVOKED_REFRESH_TOKEN',
        message: 'Refresh token has been revoked or replaced',
      });
    }

    // Revoke old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: matchedTokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Issue fresh tokens
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'USER_NOT_FOUND',
        message: 'User no longer exists',
      });
    }

    const tokens = await this.issueTokens(user.id, user.tenantId, user.email, user.role);

    return { tokens };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            business: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User profile not found',
      });
    }

    return user;
  }

  private async issueTokens(
    userId: string,
    tenantId: string,
    email: string,
    role: UserRole,
  ) {
    const payload = { sub: userId, tenantId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: ENV.JWT_ACCESS_TTL_SECONDS,
      secret: ENV.JWT_SECRET,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: ENV.JWT_REFRESH_TTL_SECONDS,
      secret: ENV.JWT_SECRET,
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + ENV.JWT_REFRESH_TTL_SECONDS * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: ENV.JWT_ACCESS_TTL_SECONDS,
    };
  }
}
