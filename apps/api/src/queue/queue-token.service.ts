import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ERROR_CODES, QueueTokenClaims } from '@takda/shared';

@Injectable()
export class QueueTokenService {
  private readonly secret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.secret = this.configService.get<string>(
      'JWT_SECRET',
      'dev-secret-key',
    );
  }

  mintToken(opts: { bookingId: string; businessId: string }): {
    token: string;
    expiresAt: string;
  } {
    const expiresInSeconds = 24 * 60 * 60; // 24h
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = nowSec + expiresInSeconds;

    const payload: Omit<QueueTokenClaims, 'iat' | 'exp'> = {
      sub: opts.bookingId,
      businessId: opts.businessId,
      role: 'customer',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.secret,
      expiresIn: expiresInSeconds,
    });

    return {
      token,
      expiresAt: new Date(expSec * 1000).toISOString(),
    };
  }

  verifyToken(token: string): QueueTokenClaims {
    try {
      return this.jwtService.verify<QueueTokenClaims>(token, {
        secret: this.secret,
      });
    } catch {
      throw new UnauthorizedException({
        code: ERROR_CODES.QUEUE_TOKEN_INVALID,
        message: 'Invalid or expired queue token',
      });
    }
  }
}
